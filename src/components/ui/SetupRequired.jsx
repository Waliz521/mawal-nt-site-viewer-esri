const SETUP_SQL = `-- Paste in Supabase → SQL Editor → Run
drop policy if exists "sites_select_anon" on public.sites;
create policy "sites_select_anon" on public.sites for select to anon using (true);

drop policy if exists "site_kml_files_select_anon" on public.site_kml_files;
create policy "site_kml_files_select_anon" on public.site_kml_files for select to anon using (true);

drop policy if exists "site_layers_select_anon" on public.site_layers;
create policy "site_layers_select_anon" on public.site_layers for select to anon using (true);`;

function isEnvError(message = '') {
  const text = message.toLowerCase();
  return (
    text.includes('vite_supabase') ||
    text.includes('missing vite_') ||
    text.includes('not configured') ||
    text.includes("headers': invalid value") ||
    text.includes('invalid value')
  );
}

function isPolicyError(message = '') {
  const text = message.toLowerCase();
  return text.includes('no sites returned') || text.includes('anon read policies');
}

export default function SetupRequired({ message }) {
  const envIssue = isEnvError(message);
  const policyIssue = !envIssue && isPolicyError(message);

  return (
    <div className="setup-required">
      {envIssue ? (
        <>
          <h2>Supabase environment variables</h2>
          <p>{message}</p>
          <ol>
            <li>
              Vercel → <strong>Settings → Environment Variables</strong>
            </li>
            <li>
              Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> for{' '}
              <strong>Production</strong> and <strong>Preview</strong> (paste raw values — no
              quotes)
            </li>
            <li>
              <strong>Deployments → Redeploy</strong> (uncheck “Use existing Build Cache” if offered)
            </li>
            <li>Open the production URL: mawal-nt-site-viewer-esri.vercel.app</li>
          </ol>
          <p className="setup-note">
            Vite embeds <code>VITE_*</code> variables at build time. Refreshing alone is not enough
            after adding env vars.
          </p>
        </>
      ) : (
        <>
          <h2>One-time Supabase setup required</h2>
          <p>{message}</p>
          {policyIssue ? (
            <>
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
                Your database has sites (ingest succeeded), but the browser cannot read them until
                these anon policies are added.
              </p>
            </>
          ) : (
            <p className="setup-note">
              If the Leaflet app (mawal-nt-site-viewer) already works, anon policies are probably
              fine — check Vercel env vars and redeploy instead.
            </p>
          )}
        </>
      )}

      <button type="button" onClick={() => window.location.reload()}>
        Refresh page
      </button>
    </div>
  );
}
