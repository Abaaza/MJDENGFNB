import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import ProjectOverview from './pages/ProjectOverview';
import ProjectDocuments from './pages/ProjectDocuments';
import ProjectBoq from './pages/ProjectBoq';
import NewProject from './pages/NewProject';
import PriceMatch from './pages/PriceMatch';
import PriceList from './pages/PriceList';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuth } from './hooks/useAuth';

function AuthedApp() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-light">
      <TopBar />
      <Sidebar />
      <main className="p-8 space-y-6 flex-1">
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
      </main>
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
  const { user, loading } = useAuth(); // ensure `loading` is part of your hook

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <span className="text-gray-600">Loading...</span>
      </div>
    );
  }

  return user ? <AuthedApp /> : <UnauthedApp />;
}
