import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getProject,
  listCommunications,
  listTasks,
  listDecisions,
} from "../services/api.js";
import { LoadingState, ErrorState, EmptyState } from "../components/States.jsx";
import { PageHeader, StatCard, Panel } from "../components/Cards.jsx";
import Badge from "../components/Badge.jsx";

export default function Dashboard() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [comms, setComms] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setError(null);
        const [p, c, t, d] = await Promise.all([
          getProject(projectId),
          listCommunications(projectId),
          listTasks(projectId),
          listDecisions(projectId),
        ]);
        if (!ignore) {
          setProject(p);
          setComms(c);
          setTasks(t);
          setDecisions(d);
        }
      } catch (e) {
        if (!ignore) setError(e.message);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [projectId]);

  if (error) return <ErrorState message={error} />;
  if (!project) return <LoadingState label="Loading dashboard..." />;

  const s = project.stats || {};
  const pendingApprovals = decisions.filter((d) => d.status === "pending");
  const recentTasks = tasks.slice(0, 5);

  return (
    <div>
      <PageHeader
        title={project.name}
        subtitle={project.client ? `Client: ${project.client}` : project.description}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="communications" value={s.communications ?? 0} />
        <StatCard label="tasks" value={s.tasks ?? 0} />
        <StatCard label="pending tasks" value={s.pendingTasks ?? 0} />
        <StatCard label="completed" value={s.completedTasks ?? 0} />
        <StatCard label="decisions" value={s.decisions ?? 0} />
        <StatCard label="pending approvals" value={s.pendingApprovals ?? 0} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Action Items">
          {recentTasks.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              description="Tasks appear here once a communication is analyzed."
            />
          ) : (
            <ul className="space-y-3">
              {recentTasks.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-ink">{t.title}</p>
                    <p className="text-xs text-ink-soft font-mono mt-0.5">
                      {t.responsible} · due {t.deadline}
                    </p>
                  </div>
                  <Badge status={t.status} />
                </li>
              ))}
            </ul>
          )}
          <Link
            to={`/projects/${projectId}/tasks`}
            className="text-xs text-amber-dark hover:underline mt-4 inline-block"
          >
            View all tasks →
          </Link>
        </Panel>

        <Panel title="Pending Approvals">
          {pendingApprovals.length === 0 ? (
            <EmptyState title="Nothing pending" description="All decisions are resolved." />
          ) : (
            <ul className="space-y-3">
              {pendingApprovals.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3">
                  <p className="text-sm text-ink">{d.description}</p>
                  <Badge status={d.status} />
                </li>
              ))}
            </ul>
          )}
          <Link
            to={`/projects/${projectId}/decisions`}
            className="text-xs text-amber-dark hover:underline mt-4 inline-block"
          >
            View all decisions →
          </Link>
        </Panel>

        <Panel title="Recent Communications" className="lg:col-span-2">
          {comms.length === 0 ? (
            <EmptyState
              title="No communication logged yet"
              description="Paste a message or note to get started."
              action={
                <Link
                  to={`/projects/${projectId}/communication`}
                  className="text-sm text-amber-dark font-medium hover:underline"
                >
                  Add communication
                </Link>
              }
            />
          ) : (
            <ul className="space-y-4">
              {comms.slice(0, 4).map((c) => (
                <li key={c.id} className="border-b border-line last:border-0 pb-3 last:pb-0">
                  <p className="text-sm text-ink">
                    {c.analyzed ? c.summary : c.text.slice(0, 140) + (c.text.length > 140 ? "…" : "")}
                  </p>
                  <p className="text-xs text-ink-soft font-mono mt-1">
                    {new Date(c.createdAt).toLocaleString()} ·{" "}
                    {c.analyzed ? "analyzed" : "not analyzed yet"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
