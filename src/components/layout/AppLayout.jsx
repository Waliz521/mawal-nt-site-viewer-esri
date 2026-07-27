import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { MapFiltersProvider } from '../../contexts/MapFiltersContext';
import { SiteBatchProvider } from '../../contexts/SiteBatchContext';
import BatchToggle from './BatchToggle';

export default function AppLayout() {
  const location = useLocation();
  const isMapPage = location.pathname === '/map';

  return (
    <SiteBatchProvider>
      <MapFiltersProvider>
        <div className="app">
          <header className={`app-header app-header-compact${isMapPage ? ' app-header-map' : ''}`}>
            <div className="header-inner">
              <Link to="/" className="brand">
                <img
                  src="/brand/mawal-logo.png"
                  alt="Mawal"
                  className="brand-logo"
                  width={148}
                  height={36}
                />
                {!isMapPage ? (
                  <div className="brand-text">
                    <strong>NT Site Viewer</strong>
                    <span className="brand-subtitle">Community power-station KML profiles</span>
                  </div>
                ) : null}
              </Link>

              <BatchToggle />

              {isMapPage ? <h1 className="header-map-title">Northern Territory Map</h1> : null}

              <div className="header-end">
                <nav className="header-nav" aria-label="Main">
                  <NavLink to="/" end>
                    Sites
                  </NavLink>
                  <NavLink to="/map">Map</NavLink>
                </nav>
              </div>
            </div>
            {!isMapPage ? (
              <p className="disclaimer">
                Basemap imagery may differ from GIS analysis imagery. KML digitised in Google Earth
                Pro.
              </p>
            ) : null}
          </header>
          <main className="app-main">
            <Outlet />
          </main>
        </div>
      </MapFiltersProvider>
    </SiteBatchProvider>
  );
}
