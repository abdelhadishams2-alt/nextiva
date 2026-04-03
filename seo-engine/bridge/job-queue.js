/**
 * Job Queue — Sequential article generation queue.
 *
 * Replaces the global activeEdit mutex with a proper job queue backed
 * by the pipeline_jobs table in Supabase. Jobs are processed one at a time.
 */

const { spawn } = require('child_process');
const path = require('path');
const logger = require('./logger');
const promptGuard = require('./prompt-guard');

const MAX_SUBPROCESS_OUTPUT = 4 * 1024 * 1024; // 4MB
const EDIT_TIMEOUT_MS = 600000; // 10 minutes

class JobQueue {
  constructor({ supabase, projectDir, autoProcess = true }) {
    this.supabase = supabase;
    this.projectDir = projectDir;
    this.autoProcess = autoProcess;
    this.currentJob = null;
    this.processing = false;
    this.listeners = new Map(); // jobId → Set<callback>
  }

  /** Enqueue a new job. Returns the created job record. */
  async enqueue(token, { userId, type, articleId, config }) {
    const job = await this.supabase.createPipelineJob(token, {
      user_id: userId,
      article_id: articleId || null,
      job_type: type || 'generate',
      status: 'queued',
      config: config || {},
      progress: { stage: 'queued', percent: 0 }
    });

    this._emit(job.id, { event: 'queued', job });

    // Trigger processing (non-blocking) — skip in test mode
    if (this.autoProcess) {
      setImmediate(() => this._processNext(token));
    }

    return job;
  }

  /** Cancel a queued or running job. */
  async cancel(token, jobId) {
    if (this.currentJob && this.currentJob.id === jobId) {
      // Kill the running subprocess
      if (this.currentJob.process && !this.currentJob.process.killed) {
        this.currentJob.process.kill('SIGTERM');
      }
      this.currentJob = null;
      this.processing = false;
    }

    await this.supabase.updatePipelineJob(token, jobId, {
      status: 'cancelled',
      completed_at: new Date().toISOString()
    });

    this._emit(jobId, { event: 'cancelled' });
    logger.info('job_cancelled', { jobId });
  }

  /** Get current queue state. */
  getStatus() {
    return {
      processing: this.processing,
      currentJob: this.currentJob ? {
        id: this.currentJob.id,
        type: this.currentJob.type,
        startedAt: this.currentJob.startedAt,
        progress: this.currentJob.progress
      } : null
    };
  }

  /** Subscribe to job events. Returns unsubscribe function. */
  subscribe(jobId, callback) {
    if (!this.listeners.has(jobId)) {
      this.listeners.set(jobId, new Set());
    }
    this.listeners.get(jobId).add(callback);
    return () => this.listeners.get(jobId)?.delete(callback);
  }

  /** Process the next queued job. */
  async _processNext(token) {
    if (this.processing) return;

    // Fetch next queued job from database
    let nextJob;
    try {
      const result = await this.supabase.listPipelineJobs(token, {
        status: 'queued',
        limit: '1',
        page: '1'
      });
      if (!result.data || result.data.length === 0) return;
      nextJob = result.data[0];
    } catch (e) {
      logger.error('queue_fetch_failed', { error: e.message });
      return;
    }

    this.processing = true;
    this.currentJob = {
      id: nextJob.id,
      type: nextJob.job_type,
      startedAt: Date.now(),
      progress: { stage: 'starting', percent: 0 },
      process: null
    };

    try {
      // Update status to running
      await this.supabase.updatePipelineJob(token, nextJob.id, {
        status: 'running',
        started_at: new Date().toISOString()
      });
      this._emit(nextJob.id, { event: 'started', job: nextJob });

      // Execute the job based on type
      const result = await this._executeJob(nextJob, token);

      // Mark completed
      await this.supabase.updatePipelineJob(token, nextJob.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        result: result
      });
      this._emit(nextJob.id, { event: 'completed', result });
      logger.info('job_completed', { jobId: nextJob.id, type: nextJob.job_type });

    } catch (e) {
      // Mark failed — include step info if available
      try {
        await this.supabase.updatePipelineJob(token, nextJob.id, {
          status: 'failed',
          completed_at: new Date().toISOString(),
          error: e.message
        });
      } catch (_) { /* best effort */ }
      this._emit(nextJob.id, { event: 'failed', error: e.message, step: e.step || null });
      logger.error('job_failed', { jobId: nextJob.id, error: e.message, step: e.step || null });

    } finally {
      this.currentJob = null;
      this.processing = false;

      // Check for more queued jobs
      setImmediate(() => this._processNext(token));
    }
  }

  /** Execute a single job. Returns result object. */
  async _executeJob(job, token) {
    const config = job.config || {};

    if (job.job_type === 'edit') {
      return this._executeEdit(job, config);
    }

    if (job.job_type === 'generate') {
      return this._executeGenerate(job, config);
    }

    throw new Error('Unknown job type: ' + job.job_type);
  }

  /** Execute an edit job via Claude CLI with stage-by-stage progress. */
  _executeEdit(job, config) {
    return new Promise((resolve, reject) => {
      const prompt = config.prompt;
      if (!prompt) return reject(new Error('Edit job missing prompt'));

      this._updateProgress(job.id, 'analyzing', 10);

      // Merge resolved API keys into subprocess env (passed from /apply-edit handler)
      const env = { ...process.env, ...(config.resolvedKeys || {}) };
      delete env.CLAUDECODE;

      const proc = spawn('claude', ['-p'], {
        cwd: this.projectDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        env
      });

      this.currentJob.process = proc;

      let stdout = '';
      let stderr = '';
      let outputKilled = false;
      // Track which stages have been emitted to avoid backward jumps
      let highestPercent = 10;

      const advanceProgress = (stage, percent) => {
        if (percent > highestPercent) {
          highestPercent = percent;
          this._updateProgress(job.id, stage, percent);
        }
      };

      proc.stdout.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        if (stdout.length + stderr.length > MAX_SUBPROCESS_OUTPUT && !outputKilled) {
          outputKilled = true;
          proc.kill('SIGTERM');
        }
        // Stage-by-stage progress based on Claude CLI output patterns
        if (chunk.includes('Read') || chunk.includes('read') || chunk.includes('context')) {
          advanceProgress('reading', 25);
        }
        if (chunk.includes('Edit') || chunk.includes('edit') || chunk.includes('Writ') || chunk.includes('writ') || chunk.includes('Replac') || chunk.includes('replac')) {
          advanceProgress('rewriting', 50);
        }
        if (chunk.includes('format') || chunk.includes('Format') || chunk.includes('style') || chunk.includes('Style')) {
          advanceProgress('formatting', 75);
        }
        if (chunk.includes('verif') || chunk.includes('Verif') || chunk.includes('check') || chunk.includes('Check') || chunk.includes('consisten')) {
          advanceProgress('validating', 90);
        }
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
        if (stdout.length + stderr.length > MAX_SUBPROCESS_OUTPUT && !outputKilled) {
          outputKilled = true;
          proc.kill('SIGTERM');
        }
      });

      proc.stdin.write(prompt);
      proc.stdin.end();

      // Emit time-based progress if stdout patterns don't fire
      const progressFallback = setInterval(() => {
        if (highestPercent < 25) advanceProgress('reading', 25);
        else if (highestPercent < 50) advanceProgress('rewriting', 50);
        else if (highestPercent < 75) advanceProgress('formatting', 75);
      }, 15000); // advance every 15s as fallback

      const timeout = setTimeout(() => {
        clearInterval(progressFallback);
        if (!proc.killed) {
          proc.kill('SIGTERM');
          reject(new Error('Edit timed out after 10 minutes'));
        }
      }, EDIT_TIMEOUT_MS);

      proc.on('close', (code) => {
        clearTimeout(timeout);
        clearInterval(progressFallback);
        this._updateProgress(job.id, 'complete', 100);

        if (outputKilled) {
          reject(new Error('Subprocess output exceeded 4MB limit'));
        } else if (code === 0) {
          resolve({ output: stdout.trim() });
        } else {
          reject(new Error(stderr || stdout || 'Claude exited with code ' + code));
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timeout);
        clearInterval(progressFallback);
        reject(new Error('Failed to start claude CLI: ' + err.message));
      });
    });
  }

  /** Execute a generate job via Claude CLI with article-engine skill. */
  _executeGenerate(job, config) {
    return new Promise((resolve, reject) => {
      const topic = config.topic;
      if (!topic) return reject(new Error('Generate job missing topic'));

      this._updateProgress(job.id, 'starting', 5);

      // Build the prompt for Claude CLI with full config context
      const promptParts = [`Generate an article about: ${topic}`];
      if (config.language && config.language !== 'en') promptParts.push(`Language: ${config.language}`);
      if (config.framework && config.framework !== 'html') promptParts.push(`Framework: ${config.framework}`);
      if (config.domain_hint) promptParts.push(`Domain focus: ${config.domain_hint}`);
      if (config.image_count !== undefined) promptParts.push(`Target images: ${config.image_count}`);
      const prompt = promptParts.join('\n');

      // Merge resolved API keys into env
      const env = { ...process.env, ...(config.resolvedKeys || {}) };
      // Remove CLAUDECODE to prevent nested session error
      delete env.CLAUDECODE;

      // Inject full config as environment variables for the subprocess
      env.CHAINIQ_TOPIC = topic;
      env.CHAINIQ_LANGUAGE = config.language || 'en';
      env.CHAINIQ_FRAMEWORK = config.framework || 'html';
      env.CHAINIQ_CSS_FRAMEWORK = config.css_framework || 'inline';
      env.CHAINIQ_IMAGE_STYLE = config.image_style || 'realistic';
      env.CHAINIQ_IMAGE_COUNT = String(config.image_count ?? 6);
      if (config.domain_hint) env.CHAINIQ_DOMAIN_HINT = config.domain_hint;
      if (config.project_dir) env.CHAINIQ_PROJECT_DIR = config.project_dir;

      // Validate topic with prompt guard before sending to CLI
      const guardResult = promptGuard.check(`Generate article: ${topic}`);
      if (!guardResult.safe) {
        return reject(new Error('Topic rejected by prompt guard: ' + guardResult.reason));
      }

      const proc = spawn('claude', ['-p', '--allowedTools', 'Read,Write,Edit,Glob,Grep,Bash,Agent,Skill,WebSearch,WebFetch'], {
        cwd: this.projectDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        env
      });

      this.currentJob.process = proc;

      let stdout = '';
      let stderr = '';
      let outputKilled = false;
      let lastStage = 'starting';
      const GENERATE_TIMEOUT_MS = 1200000; // 20 minutes for full generation

      proc.stdout.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        if (stdout.length + stderr.length > MAX_SUBPROCESS_OUTPUT && !outputKilled) {
          outputKilled = true;
          proc.kill('SIGTERM');
        }
        // Parse progress from Claude CLI output
        if (chunk.includes('Parsing topic')) { lastStage = 'parsing'; this._updateProgress(job.id, 'parsing', 10); }
        else if (chunk.includes('Analyzing') || chunk.includes('design system')) { lastStage = 'analyzing'; this._updateProgress(job.id, 'analyzing', 20); }
        else if (chunk.includes('Research') || chunk.includes('Researching')) { lastStage = 'researching'; this._updateProgress(job.id, 'researching', 35); }
        else if (chunk.includes('Generating') && chunk.includes('concept')) { lastStage = 'concepts'; this._updateProgress(job.id, 'concepts', 50); }
        else if (chunk.includes('architecture') || chunk.includes('Architecture')) { lastStage = 'architecture'; this._updateProgress(job.id, 'architecture', 55); }
        else if (chunk.includes('image') || chunk.includes('Image')) { lastStage = 'images'; this._updateProgress(job.id, 'images', 65); }
        else if (chunk.includes('Writing') || chunk.includes('article')) { lastStage = 'writing'; this._updateProgress(job.id, 'writing', 75); }
        else if (chunk.includes('consistency') || chunk.includes('Consistency')) { lastStage = 'finalizing'; this._updateProgress(job.id, 'finalizing', 90); }
        else if (chunk.includes('delivered') || chunk.includes('Delivered')) { lastStage = 'complete'; this._updateProgress(job.id, 'complete', 100); }
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
        if (stdout.length + stderr.length > MAX_SUBPROCESS_OUTPUT && !outputKilled) {
          outputKilled = true;
          proc.kill('SIGTERM');
        }
      });

      proc.stdin.write(prompt);
      proc.stdin.end();

      const timeout = setTimeout(() => {
        if (!proc.killed) {
          proc.kill('SIGTERM');
          reject(new Error('Generation timed out after 20 minutes'));
        }
      }, GENERATE_TIMEOUT_MS);

      proc.on('close', (code) => {
        clearTimeout(timeout);
        this._updateProgress(job.id, 'complete', 100);

        if (outputKilled) {
          const err = new Error('Subprocess output exceeded 4MB limit');
          err.step = lastStage;
          reject(err);
        } else if (code === 0) {
          logger.info('job_completed', { jobId: job.id, type: 'generate' });
          // Extract article metadata from output
          const filePath = this._extractFilePath(stdout);
          const wordCount = this._estimateWordCount(stdout);
          resolve({
            output: stdout.slice(-2000),
            topic: config.topic,
            article_id: job.article_id || null,
            file_path: filePath,
            word_count: wordCount
          });
        } else {
          const err = new Error(stderr.slice(-1000) || stdout.slice(-1000) || 'Claude exited with code ' + code);
          err.step = lastStage;
          reject(err);
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timeout);
        const wrappedErr = new Error('Failed to start claude CLI: ' + err.message);
        wrappedErr.step = lastStage;
        reject(wrappedErr);
      });
    });
  }

  /** Extract file path from Claude CLI output (best-effort heuristic). */
  _extractFilePath(output) {
    // Look for common patterns: "saved to: path", "wrote: path", "created: path", file path with extension
    const patterns = [
      /(?:saved|wrote|created|output|generated)\s*(?:to|at|file)?:?\s*[`"']?([^\s`"'\n]+\.(?:html|tsx|jsx|vue|svelte|astro|php))/i,
      /(?:file|article|output)\s*(?:path)?:?\s*[`"']?([^\s`"'\n]+\.(?:html|tsx|jsx|vue|svelte|astro|php))/i,
    ];
    for (const pattern of patterns) {
      const match = output.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  }

  /** Estimate word count from output (rough heuristic from article content). */
  _estimateWordCount(output) {
    // Look for word count mentions in the output
    const countMatch = output.match(/(\d{3,5})\s*words?/i);
    if (countMatch) return parseInt(countMatch[1], 10);
    // Fallback: count words in the last portion (article content area)
    const lastChunk = output.slice(-4000);
    const words = lastChunk.split(/\s+/).filter(w => w.length > 0);
    return Math.max(0, words.length - 100); // subtract overhead from CLI output
  }

  /** Update progress and notify listeners. */
  _updateProgress(jobId, stage, percent) {
    if (this.currentJob && this.currentJob.id === jobId) {
      this.currentJob.progress = { stage, percent };
    }
    this._emit(jobId, { event: 'progress', stage, percent });
  }

  /** Emit event to job subscribers. */
  _emit(jobId, data) {
    const callbacks = this.listeners.get(jobId);
    if (callbacks) {
      for (const cb of callbacks) {
        try { cb(data); } catch (_) {}
      }
    }
  }
}

module.exports = { JobQueue };
