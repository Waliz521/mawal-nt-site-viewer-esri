const SETUP_SQL = `-- Paste in Supabase → SQL Editor → Run
drop policy if exists "sites_select_anon" on public.sites;
create policy "sites_select_anon" on public.sites for select to anon using (true);

drop policy if exists "site_kml_files_select_anon" on public.site_kml_files;
create policy "site_kml_files_select_anon" on public.site_kml_files for select to anon using (true);

drop policy if exists "site_layers_select_anon" on public.site_layers;
create policy "site_layers_select_anon" on public.site_layers for select to anon using (true);`;

export default function SetupRequired({ message }) {
  return (
    <div className="setup-required">
      <h2>One-time Supabase setup required</h2>
      <p>{message}</p>
      <ol>
        <li>Open your Supabase project → <strong>SQL Editor</strong> → New query</li>
        <li>Paste the SQL below and click <strong>Run</strong></li>
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
