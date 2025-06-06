import { Link, useParams, useNavigate } from 'react-router-dom';
import { sampleProjects } from '../data/sampleProjects';
import StatusBadge from '../components/StatusBadge';
import format from 'date-fns/format';

export default function ProjectOverview() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ⚠️ replace with real fetch when API is ready
  const project = sampleProjects.find((p) => p.id === id);

  if (!project)
    return (
      <p className="text-gray-500">
        Project not found. <button onClick={() => navigate(-1)} className="underline text-brand-accent">Go back</button>
      </p>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-dark">
          {project.id} – {project.client}
        </h1>

        <Link to="/" className="text-brand-accent underline">
          ← Back
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
        <p>
          <strong>Type:</strong> {project.type}
        </p>
        <p>
          <strong>Due:</strong> {format(new Date(project.due), 'd MMM yyyy')}
        </p>
        <p>
          <strong>Status:</strong> <StatusBadge label={project.status} />
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          to={`/projects/${project.id}/documents`}
          className="px-4 py-2 bg-brand-accent text-white rounded hover:opacity-90"
        >
          Documents
        </Link>
        <Link
          to={`/projects/${project.id}/boq`}
          className="px-4 py-2 bg-brand-dark text-white rounded hover:opacity-90"
        >
          BoQ
        </Link>
      </div>
    </div>
  );
}
