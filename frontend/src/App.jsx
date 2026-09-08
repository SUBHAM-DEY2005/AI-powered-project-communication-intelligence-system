import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import { ToastProvider } from "./hooks/useToast.jsx";
import Projects from "./pages/Projects.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Communication from "./pages/Communication.jsx";
import Tasks from "./pages/Tasks.jsx";
import Decisions from "./pages/Decisions.jsx";
import Search from "./pages/Search.jsx";

export default function App() {
  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 px-8 py-8 max-w-6xl">
          <Routes>
            <Route path="/" element={<Navigate to="/projects" replace />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId" element={<Dashboard />} />
            <Route path="/projects/:projectId/communication" element={<Communication />} />
            <Route path="/projects/:projectId/tasks" element={<Tasks />} />
            <Route path="/projects/:projectId/decisions" element={<Decisions />} />
            <Route path="/projects/:projectId/search" element={<Search />} />
            <Route path="*" element={<Navigate to="/projects" replace />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}
