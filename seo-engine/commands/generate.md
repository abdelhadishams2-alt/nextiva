---
name: generate
description: Generate an article from a keyword. Asks for the topic and optional language, then runs the full article engine pipeline.
---

# Generate Article

Generate a complete article using the Article Engine pipeline. Collects minimal input and auto-detects everything else from the project.

## Steps

1. **Ask the user for the topic/keyword** (required):
   ```
   What topic would you like to write about?
   ```
   Wait for the user's response. This can be a single keyword ("Manchester United"), multiple keywords ("electric vehicles, battery tech"), a phrase ("the history of chess"), or a sentence ("Write about how AI is changing football scouting").

2. **Ask for target language** (optional):
   ```
   What language should the article be in? (default: English)
   Options: English, Arabic, Spanish, French, German, Russian, Chinese, Japanese, Korean, Portuguese, Hebrew
   ```
   If the user skips or says "default", use English. If the bridge server is running, try to fetch the user's preferred language from `GET http://127.0.0.1:19847/api/settings` (with stored auth token) and use that as the default instead.

3. **Invoke the article engine skill:**
   Pass the collected topic to the `article-engine` skill. The skill's 22-step pipeline will:
   - Detect the project's framework, design system, and components automatically
   - Research the topic using Gemini MCP or web search
   - Generate article concepts for the user to choose from
   - Build the article architecture with blueprint components
   - Generate images
   - Write the full article in the project's native format

   Simply provide the topic as natural language input to the skill. If a non-English language was selected, prefix the topic with a language instruction:
   - For English: just pass the topic as-is
   - For other languages: "Write this article in [language]: [topic]"

4. **The skill handles everything else.** No further action needed from this command. The skill will interact with the user for concept selection and deliver the final article.
