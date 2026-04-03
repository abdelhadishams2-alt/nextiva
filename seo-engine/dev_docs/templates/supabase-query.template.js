/**
 * @module {{MODULE_NAME}}
 * @description Supabase query patterns for {{TABLE_NAME}}
 * @see dev_docs/specs/database/ for schema definitions
 *
 * Copy these patterns when writing database queries. ChainIQ uses Supabase
 * REST client (native fetch) — no ORM. All queries go through supabase-client.js.
 */

'use strict';

// ── LIST (paginated, filtered, sorted) ──────────────────────────────────────

async function list{{EntityPlural}}(userId, { page = 1, limit = 20, sort = 'created_at', order = 'desc', status, search } = {}) {
  const offset = (page - 1) * limit;

  let query = supabase.from('{{table_name}}')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order(sort, { ascending: order === 'asc' })
    .range(offset, offset + limit - 1);

  // Optional filters
  if (status) query = query.eq('status', status);
  if (search) query = query.ilike('title', `%${search}%`);

  const { data, error, count } = await query;

  if (error) throw new Error(`list{{EntityPlural}} failed: ${error.message}`);

  return {
    data,
    meta: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    }
  };
}

// ── GET BY ID ───────────────────────────────────────────────────────────────

async function get{{Entity}}(userId, id) {
  const { data, error } = await supabase.from('{{table_name}}')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)  // RLS enforces this too, but belt-and-suspenders
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw new Error(`get{{Entity}} failed: ${error.message}`);
  }

  return data;
}

// ── CREATE ──────────────────────────────────────────────────────────────────

async function create{{Entity}}(userId, payload) {
  const { data, error } = await supabase.from('{{table_name}}')
    .insert({
      user_id: userId,
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw new Error(`create{{Entity}} failed: ${error.message}`);

  return data;
}

// ── UPDATE ──────────────────────────────────────────────────────────────────

async function update{{Entity}}(userId, id, updates) {
  const { data, error } = await supabase.from('{{table_name}}')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(`update{{Entity}} failed: ${error.message}`);

  return data;
}

// ── DELETE ───────────────────────────────────────────────────────────────────

async function delete{{Entity}}(userId, id) {
  const { error } = await supabase.from('{{table_name}}')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(`delete{{Entity}} failed: ${error.message}`);
}

// ── UPSERT (insert or update on conflict) ───────────────────────────────────

async function upsert{{Entity}}(userId, payload, conflictColumns = ['user_id', 'external_id']) {
  const { data, error } = await supabase.from('{{table_name}}')
    .upsert({
      user_id: userId,
      ...payload,
      updated_at: new Date().toISOString()
    }, { onConflict: conflictColumns.join(',') })
    .select()
    .single();

  if (error) throw new Error(`upsert{{Entity}} failed: ${error.message}`);

  return data;
}

// ── BATCH INSERT ────────────────────────────────────────────────────────────

async function batchInsert{{EntityPlural}}(userId, items, batchSize = 500) {
  const rows = items.map(item => ({
    user_id: userId,
    ...item,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const results = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { data, error } = await supabase.from('{{table_name}}')
      .insert(batch)
      .select();

    if (error) throw new Error(`batchInsert failed at offset ${i}: ${error.message}`);
    results.push(...data);
  }

  return results;
}
