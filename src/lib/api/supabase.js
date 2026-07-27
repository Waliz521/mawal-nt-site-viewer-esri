import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(url ?? '', anonKey ?? '');

export async function fetchSites() {
  const { data, error, count } = await supabase
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
  const { data, error } = await supabase.from('sites').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchSiteLayers(siteId) {
  const { data, error } = await supabase
    .from('site_layers')
    .select('*')
    .eq('site_id', siteId)
    .order('layer_type')
    .order('layer_name');

  if (error) throw error;
  return data;
}

export async function fetchAllLayers() {
  const { data, error } = await supabase
    .from('site_layers')
    .select('*, sites(name, slug)')
    .order('layer_type')
    .order('layer_name');

  if (error) throw error;
  return data ?? [];
}
