const SETUP_SQL = `-- Paste in Supabase → SQL Editor → Run
drop policy if exists "sites_select_anon" on public.sites;
create policy "sites_select_anon" on public.sites for select to anon using (true);

drop policy if exists "site_kml_files_select_anon" on public.site_kml_files;
create policy "site_kml_files_select_anon" on public.site_kml_files for select to anon using (true);

drop policy if exists "site_layers_select_anon" on public.site_layers;
create policy "site_layers_select_anon" on public.site_layers for select to anon using (true);`;

function resolveSetupKind(message) {
  const text = String(message ?? '');

  if (
    text.includes('VITE_SUPABASE_URL') ||
    text.includes('VITE_SUPABASE_ANON_KEY') ||
    (text.includes('Headers') && text.includes('Invalid value'))
  ) {
    return 'env';
  }

  if (text.includes('anon read policies') || text.includes('No sites returned')) {
    return 'rls';
  }

  return 'generic';
}

export default function SetupRequired({ message }) {
  const kind = resolveSetupKind(message);

  if (kind === 'env') {
    return (
      <div className="setup-required">
        <h2>Supabase environment variables missing</h2>
        <p>{message}</p>
        <ol>
          <li>
            Open <strong>Vercel</strong> → this project → <strong>Settings</strong> →{' '}
            <strong>Environment Variables</strong>
          </li>
          <li>
            Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> (copy from
            the working Leaflet app: <code>mawal-nt-site-viewer-web</code>)
          </li>
          <li>
            Redeploy, or push a new commit so Vercel rebuilds with the variables baked into the
            bundle
          </li>
        </ol>
        <p className="setup-note">
          Vite only exposes variables that exist at build time. If they were added after the last
          deploy, trigger a redeploy.
        </p>
        <button type="button" onClick={() => window.location.reload()}>
          Refresh page
        </button>
      </div>
    );
  }

  if (kind === 'rls') {
    return (
      <div className="setup-required">
        <h2>One-time Supabase setup required</h2>
        <p>{message}</p>
        <ol>
          <li>
            Open your Supabase project → <strong>SQL Editor</strong> → New query
          </li>
          <li>
            Paste the SQL below and click <strong>Run</strong>
          </li>
          <li>Refresh this page</li>
        </ol>
        <pre>{SETUP_SQL}</pre>
        <p className="setup-note">
          Your database has sites (ingest succeeded), but the browser cannot read them until these
          anon policies are added.
        </p>
        <button type="button" onClick={() => window.location.reload()}>
          Refresh page
        </button>
      </div>
    );
  }

  return (
    <div className="setup-required">
      <h2>Could not load site data</h2>
      <p>{message}</p>
      <button type="button" onClick={() => window.location.reload()}>
        Refresh page
      </button>
    </div>
  );
}
