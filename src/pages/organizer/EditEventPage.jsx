import { useParams } from 'react-router-dom';
export default function EditEventPage() {
  const { id } = useParams();
  return <div className="p-8"><h1 className="text-2xl font-800 text-neutral-900 mb-2">Edit Event</h1><p className="text-neutral-500">Phase 7 — Event editing coming soon.</p></div>;
}
