import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listProjects, createProject, deleteProject } from "../services/api.js";
import { LoadingState, EmptyState, ErrorState } from "../components/States.jsx";
import { PageHeader } from "../components/Cards.jsx";
import { useToast } from "../hooks/useToast.jsx";

export default function Projects() {
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const load = async () => {
    try {
      setError(null);
      const data = await listProjects();
      setProjects(data);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This removes all its communications, tasks, and decisions.`)) {
      return;
    }
    try {
      await deleteProject(id);
      toast.success("Project deleted");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Every project keeps its own communication history, tasks, and decisions."
        action={
          <button
            onClick={() => setShowForm((s) => !s)}
            className="bg-ink text-paper text-sm px-4 py-2 rounded hover:bg-ink-light transition-colors"
          >
            {showForm ? "Cancel" : "New Project"}
          </button>
        }
      />

      {showForm && (
        <NewProjectForm
          onCreated={(p) => {
            setShowForm(false);
            navigate(`/projects/${p.id}`);
          }}
        />
      )}

      {error && <ErrorState message={error} />}
      {!error && projects === null && <LoadingState label="Loading projects..." />}

      {projects && projects.length === 0 && (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start capturing and analyzing communication."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-amber-dark font-medium hover:underline"
            >
              Create a project
            </button>
          }
        />
      )}

      {projects && projects.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className="border border-line rounded bg-white p-5 flex flex-col justify-between hover:border-ink/30 transition-colors"
            >
              <div>
                <Link to={`/projects/${p.id}`} className="font-medium text-ink hover:text-amber-dark">
                  {p.name}
                </Link>
                {p.client && <p className="text-ink-soft text-xs mt-1">Client: {p.client}</p>}
                {p.description && (
                  <p className="text-ink-soft text-sm mt-2 line-clamp-2">{p.description}</p>
                )}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-line text-xs">
                <span className="font-mono text-ink-soft">
                  {p.stats?.tasks ?? 0} tasks · {p.stats?.communications ?? 0} comms
                </span>
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  className="text-clay hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewProjectForm({ onCreated }) {
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    setSubmitting(true);
    try {
      const project = await createProject({ name, client, description });
      toast.success("Project created");
      onCreated(project);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="border border-line rounded bg-white p-5 mb-6 grid sm:grid-cols-2 gap-4"
    >
      <div className="sm:col-span-2">
        <label className="text-xs font-mono text-ink-soft">Project name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Riverside Residence — Interior Fit-Out"
          className="w-full mt-1 border border-line rounded px-3 py-2 text-sm focus:border-amber"
        />
      </div>
      <div>
        <label className="text-xs font-mono text-ink-soft">Client</label>
        <input
          value={client}
          onChange={(e) => setClient(e.target.value)}
          placeholder="Client name"
          className="w-full mt-1 border border-line rounded px-3 py-2 text-sm focus:border-amber"
        />
      </div>
      <div>
        <label className="text-xs font-mono text-ink-soft">Description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description"
          className="w-full mt-1 border border-line rounded px-3 py-2 text-sm focus:border-amber"
        />
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-amber text-ink font-medium text-sm px-4 py-2 rounded hover:bg-amber-dark disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create project"}
        </button>
      </div>
    </form>
  );
}
