import { createClient } from '@supabase/supabase-js';

function readEnv(name) {
  const raw = import.meta.env[name];
  if (typeof raw !== 'string') return '';
  return raw.trim();
}

const url = readEnv('VITE_SUPABASE_URL');
const anonKey = readEnv('VITE_SUPABASE_ANON_KEY');

export function getSupabaseConfigError() {
  if (!url && !anonKey) {
    return 'Missing VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Add them in Vercel → Settings → Environment Variables, then redeploy (Vite bakes them in at build time).';
  }
  if (!url) {
    return 'Missing VITE_SUPABASE_URL. Add it in Vercel → Settings → Environment Variables, then redeploy.';
  }
  if (!anonKey) {
    return 'Missing VITE_SUPABASE_ANON_KEY. Add it in Vercel → Settings → Environment Variables, then redeploy.';
  }
  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    return 'VITE_SUPABASE_URL looks invalid. It should be https://YOUR-PROJECT.supabase.co with no quotes or trailing spaces.';
  }
  if (anonKey.startsWith('"') || anonKey.endsWith('"') || anonKey.includes('\n')) {
    return 'VITE_SUPABASE_ANON_KEY looks invalid (quotes or line breaks). Paste the raw JWT only, then redeploy.';
  }
  return null;
}

const configError = getSupabaseConfigError();
if (configError) {
  console.error(configError);
}

export const supabase = configError ? null : createClient(url, anonKey);

function requireClient() {
  if (!supabase) throw new Error(configError ?? 'Supabase is not configured.');
  return supabase;
}

export async function fetchSites() {
  const client = requireClient();
  const { data, error, count } = await client
    .from('sites')
    .select('*', { count: 'exact' })
    .order('site_number', { ascending: true, nullsFirst: false })
    .order('name');

  if (error) throw error;

  if ((!data || data.length === 0) && count === 0) {
    throw new Error(
      'No sites returned. Run npm run setup:db in site-viewer (anon read policies), or run 002_anon_read_policies.sql in Supabase SQL Editor.',
    );
  }

  return data ?? [];
}

export async function fetchSiteBySlug(slug) {
  const client = requireClient();
  const { data, error } = await client.from('sites').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchSiteLayers(siteId) {
  const client = requireClient();
  const { data, error } = await client
    .from('site_layers')
    .select('*')
    .eq('site_id', siteId)
    .order('layer_type')
    .order('layer_name');

  if (error) throw error;
  return data;
}

export async function fetchAllLayers() {
  const client = requireClient();
  const { data, error } = await client
    .from('site_layers')
    .select('*, sites(name, slug)')
    .order('layer_type')
    .order('layer_name');

  if (error) throw error;
  return data ?? [];
}
