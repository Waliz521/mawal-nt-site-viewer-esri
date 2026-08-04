import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const SUPABASE_CONFIGURED = Boolean(url && anonKey);

export const MISSING_SUPABASE_ENV_MESSAGE =
  'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY on this deployment. In Vercel → Project → Settings → Environment Variables, add both keys (same values as the Leaflet app), then redeploy.';

let client = null;

export function getSupabaseClient() {
  if (!SUPABASE_CONFIGURED) {
    throw new Error(MISSING_SUPABASE_ENV_MESSAGE);
  }

  if (!client) {
    client = createClient(url, anonKey);
  }

  return client;
}

/** @deprecated Prefer getSupabaseClient() — kept for any legacy imports. */
export const supabase = {
  from(table) {
    return getSupabaseClient().from(table);
  },
};

export async function fetchSites() {
  const { data, error, count } = await getSupabaseClient()
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
  const { data, error } = await getSupabaseClient()
    .from('sites')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchSiteLayers(siteId) {
  const { data, error } = await getSupabaseClient()
    .from('site_layers')
    .select('*')
    .eq('site_id', siteId)
    .order('layer_type')
    .order('layer_name');

  if (error) throw error;
  return data;
}

export async function fetchAllLayers() {
  const { data, error } = await getSupabaseClient()
    .from('site_layers')
    .select('*, sites(name, slug)')
    .order('layer_type')
    .order('layer_name');

  if (error) throw error;
  return data ?? [];
}
