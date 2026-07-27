import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="state-msg">
      <h2>Page not found</h2>
      <p>The page you requested does not exist.</p>
      <Link to="/">← Back to sites</Link>
    </div>
  );
}
