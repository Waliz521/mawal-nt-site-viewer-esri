import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import HomePage from './features/home/HomePage';
import OverviewMapPage from './features/overview-map/OverviewMapPage';
import NotFoundPage from './pages/NotFoundPage';
import { SiteDetailRoute, SitesIndexRedirect } from './pages/SiteDetailRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="map" element={<OverviewMapPage />} />
          <Route path="sites" element={<SitesIndexRedirect />} />
          <Route path="sites/" element={<SitesIndexRedirect />} />
          <Route path="sites/:slug" element={<SiteDetailRoute />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
