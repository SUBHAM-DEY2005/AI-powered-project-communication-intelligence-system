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
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ title: "", responsible: "", deadline: "" });
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

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditDraft({ title: task.title, responsible: task.responsible, deadline: task.deadline });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (taskId) => {
    if (!editDraft.title.trim()) {
      toast.error("Task title can't be empty");
      return;
    }
    try {
      await updateTask(taskId, {
        title: editDraft.title.trim(),
        responsible: editDraft.responsible.trim() || "Not specified",
        deadline: editDraft.deadline.trim() || "Not specified",
      });
      toast.success("Task updated");
      setEditingId(null);
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
              {tasks.map((t) =>
                editingId === t.id ? (
                  <tr key={t.id} className="border-b border-line last:border-0 bg-amber/5">
                    <td className="py-2 pr-3">
                      <input
                        value={editDraft.title}
                        onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                        className="w-full border border-line rounded px-2 py-1 text-sm focus:border-amber"
                        autoFocus
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        value={editDraft.responsible}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, responsible: e.target.value }))
                        }
                        className="w-full border border-line rounded px-2 py-1 text-sm focus:border-amber"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        value={editDraft.deadline}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, deadline: e.target.value }))
                        }
                        className="w-full border border-line rounded px-2 py-1 text-sm focus:border-amber"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <Badge status={t.status} />
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <button
                        onClick={() => saveEdit(t.id)}
                        className="text-xs text-moss font-medium hover:underline mr-3"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-xs text-ink-soft hover:underline"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={t.id} className="border-b border-line last:border-0 group">
                    <td className="py-3 pr-3 text-ink">{t.title}</td>
                    <td className="py-3 pr-3 text-ink-soft">{t.responsible}</td>
                    <td className="py-3 pr-3 text-ink-soft font-mono text-xs">{t.deadline}</td>
                    <td className="py-3 pr-3">
                      <button onClick={() => cycleStatus(t)} title="Click to advance status">
                        <Badge status={t.status} />
                      </button>
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => startEdit(t)}
                        title="Edit task"
                        className="text-ink-soft hover:text-amber-dark transition-colors mr-3"
                      >
                        <svg
                          className="w-4 h-4 inline"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => remove(t)}
                        className="text-xs text-clay hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}