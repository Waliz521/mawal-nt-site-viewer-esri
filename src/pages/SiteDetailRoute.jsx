import { Navigate, useParams } from 'react-router-dom';
import SiteDetailPage from '../features/site-detail/SiteDetailPage';

export function SitesIndexRedirect() {
  return <Navigate to="/" replace />;
}

export function SiteDetailRoute() {
  const { slug } = useParams();
  if (!slug) return <Navigate to="/" replace />;
  return <SiteDetailPage key={slug} />;
}
