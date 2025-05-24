import { useParams, Link } from 'react-router-dom';
import DocumentUploader from '../components/DocumentUploader';

export default function ProjectDocuments() {
  const { id } = useParams();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-dark">Documents – {id}</h1>
        <Link to="/" className="text-brand-accent underline">
          ← Back
        </Link>
      </div>
      <DocumentUploader projectId={id} />
    </div>
  );
}
