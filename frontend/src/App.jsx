import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Spinner from './components/Spinner';
import { useAuth } from './hooks/useAuth';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProjectOverview = lazy(() => import('./pages/ProjectOverview'));
const ProjectDocuments = lazy(() => import('./pages/ProjectDocuments'));
const ProjectBoq = lazy(() => import('./pages/ProjectBoq'));
const NewProject = lazy(() => import('./pages/NewProject'));
const PriceMatch = lazy(() => import('./pages/PriceMatch'));
const PriceList = lazy(() => import('./pages/PriceList'));
const Admin = lazy(() => import('./pages/Admin'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

function AuthedApp() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-light">
      <TopBar />
      <Sidebar />
      <main className="p-8 space-y-6 flex-1">
        <Suspense fallback={<Spinner className="py-10" />}>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="/new-project" element={<NewProject />} />
            <Route path="/projects/:id" element={<ProjectOverview />} />
            <Route path="/projects/:id/documents" element={<ProjectDocuments />} />
            <Route path="/projects/:id/boq" element={<ProjectBoq />} />
            <Route path="/price-match" element={<PriceMatch />} />
            <Route path="/price-list" element={<PriceList />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

function UnauthedApp() {
  return (
    <Suspense fallback={<Spinner className="py-10" />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  const { user, loading } = useAuth(); // ensure `loading` is part of your hook

  if (loading) {
    return <Spinner className="h-screen" />;
  }

  return user ? <AuthedApp /> : <UnauthedApp />;
}
