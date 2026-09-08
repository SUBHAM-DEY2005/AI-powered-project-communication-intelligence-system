import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { listTasks, updateTask, deleteTask } from "../services/api.js";
import { LoadingState, EmptyState, ErrorState } from "../components/States.jsx";
import { PageHeader, Panel } from "../components/Cards.jsx";
import Badge from "../components/Badge.jsx";
import { useToast } from "../hooks/useToast.jsx";

const STATUSES = ["pending", "in_progress", "completed"];
const FILTERS = [{ value: "", label: "All" }, ...STATUSES.map((s) => ({ value: s, label: s.replace("_", " ") }))];

export default function Tasks() {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState(null);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState(null);
  const toast = useToast();

  const load = async () => {
    try {
      setError(null);
      const data = await listTasks(projectId, filter || undefined);
      setTasks(data);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, filter]);

  const cycleStatus = async (task) => {
    const next =
      task.status === "pending"
        ? "in_progress"
        : task.status === "in_progress"
        ? "completed"
        : "pending";
    try {
      await updateTask(task.id, { status: next });
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async (task) => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    try {
      await deleteTask(task.id);
      toast.success("Task deleted");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="Tasks extracted from communication. Click a status badge to advance it."
      />

      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-xs px-3 py-1.5 rounded border capitalize ${
              filter === f.value
                ? "bg-ink text-paper border-ink"
                : "border-line text-ink-soft hover:border-ink/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <ErrorState message={error} />}
      {!error && tasks === null && <LoadingState label="Loading tasks..." />}

      {tasks && tasks.length === 0 && (
        <EmptyState
          title="No tasks found"
          description="Tasks appear automatically when you analyze a communication."
        />
      )}

      {tasks && tasks.length > 0 && (
        <Panel>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-soft text-xs font-mono border-b border-line">
                <th className="pb-2 font-normal">Task</th>
                <th className="pb-2 font-normal">Responsible</th>
                <th className="pb-2 font-normal">Deadline</th>
                <th className="pb-2 font-normal">Status</th>
                <th className="pb-2 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="border-b border-line last:border-0">
                  <td className="py-3 pr-3 text-ink">{t.title}</td>
                  <td className="py-3 pr-3 text-ink-soft">{t.responsible}</td>
                  <td className="py-3 pr-3 text-ink-soft font-mono text-xs">{t.deadline}</td>
                  <td className="py-3 pr-3">
                    <button onClick={() => cycleStatus(t)} title="Click to advance status">
                      <Badge status={t.status} />
                    </button>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => remove(t)}
                      className="text-xs text-clay hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
