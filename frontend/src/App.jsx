import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import ProjectOverview from './pages/ProjectOverview';
import ProjectDocuments from './pages/ProjectDocuments';
import ProjectBoq from './pages/ProjectBoq';
import NewProject from './pages/NewProject';
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuth } from './hooks/useAuth';

function AuthedApp() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-brand-light min-h-screen">
        <TopBar />
        <main className="p-8 space-y-6">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="/new-project" element={<NewProject />} />
            <Route path="/projects/:id" element={<ProjectOverview />} />
            <Route path="/projects/:id/documents" element={<ProjectDocuments />} />
            <Route path="/projects/:id/boq" element={<ProjectBoq />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function UnauthedApp() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  const { user } = useAuth();
  return user ? <AuthedApp /> : <UnauthedApp />;
}
