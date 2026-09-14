import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { listDecisions, updateDecision, deleteDecision } from "../services/api.js";
import { LoadingState, EmptyState, ErrorState } from "../components/States.jsx";
import { PageHeader, Panel } from "../components/Cards.jsx";
import Badge from "../components/Badge.jsx";
import { useToast } from "../hooks/useToast.jsx";

const STATUS_OPTIONS = ["approved", "rejected", "pending"];

export default function Decisions() {
  const { projectId } = useParams();
  const [decisions, setDecisions] = useState(null);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ description: "", status: "approved" });
  const toast = useToast();

  const load = async () => {
    try {
      setError(null);
      setDecisions(await listDecisions(projectId));
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const startEdit = (d) => {
    setEditingId(d.id);
    setEditDraft({ description: d.description, status: d.status });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id) => {
    if (!editDraft.description.trim()) {
      toast.error("Description can't be empty");
      return;
    }
    try {
      await updateDecision(id, {
        description: editDraft.description.trim(),
        status: editDraft.status,
      });
      toast.success("Decision updated");
      setEditingId(null);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async (d) => {
    if (!window.confirm(`Delete this decision?\n\n"${d.description}"`)) return;
    try {
      await deleteDecision(d.id);
      toast.success("Decision deleted");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (error) return <ErrorState message={error} />;
  if (decisions === null) return <LoadingState label="Loading decisions..." />;

  return (
    <div>
      <PageHeader
        title="Decisions"
        subtitle="Approvals, rejections, and pending decisions extracted from communication."
      />

      {decisions.length === 0 ? (
        <EmptyState
          title="No decisions logged yet"
          description="Decisions appear automatically when a communication is analyzed."
        />
      ) : (
        <Panel>
          <ul className="divide-y divide-line">
            {decisions.map((d) =>
              editingId === d.id ? (
                <li key={d.id} className="py-3 bg-amber/5 -mx-5 px-5">
                  <input
                    value={editDraft.description}
                    onChange={(e) =>
                      setEditDraft((s) => ({ ...s, description: e.target.value }))
                    }
                    className="w-full border border-line rounded px-2 py-1 text-sm focus:border-amber mb-2"
                    autoFocus
                  />
                  <div className="flex items-center justify-between">
                    <select
                      value={editDraft.status}
                      onChange={(e) => setEditDraft((s) => ({ ...s, status: e.target.value }))}
                      className="border border-line rounded px-2 py-1 text-xs capitalize focus:border-amber"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <div>
                      <button
                        onClick={() => saveEdit(d.id)}
                        className="text-xs text-moss font-medium hover:underline mr-3"
                      >
                        Save
                      </button>
                      <button onClick={cancelEdit} className="text-xs text-ink-soft hover:underline">
                        Cancel
                      </button>
                    </div>
                  </div>
                </li>
              ) : (
                <li key={d.id} className="py-3 flex items-center justify-between gap-3 group">
                  <div>
                    <p className="text-sm text-ink">{d.description}</p>
                    <p className="text-xs text-ink-soft font-mono mt-0.5">
                      {new Date(d.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge status={d.status} />
                    <button
                      onClick={() => startEdit(d)}
                      title="Edit decision"
                      className="text-ink-soft hover:text-amber-dark transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
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
                      onClick={() => remove(d)}
                      title="Delete decision"
                      className="text-ink-soft hover:text-clay transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </li>
              )
            )}
          </ul>
        </Panel>
      )}
    </div>
  );
}