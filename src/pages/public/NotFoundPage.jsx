import { Link } from 'react-router-dom';
import { Frown } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import SEOHead from '../../components/common/SEOHead.jsx';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <SEOHead title="Page Not Found (404) | KnowASport" noindex={true} />
      <Frown size={48} className="text-neutral-300 mb-4" />
      <h1 className="text-3xl font-800 text-neutral-900 mb-2">Page not found</h1>
      <p className="text-neutral-500 mb-8 max-w-xs">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button>
        <Link to="/events">Explore Sports Events</Link>
      </Button>
    </div>
  );
}
