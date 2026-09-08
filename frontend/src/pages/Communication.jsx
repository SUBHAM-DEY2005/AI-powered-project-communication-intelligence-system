import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  listCommunications,
  createCommunication,
  analyzeCommunication,
} from "../services/api.js";
import { LoadingState, EmptyState, ErrorState } from "../components/States.jsx";
import { PageHeader, Panel } from "../components/Cards.jsx";
import { useToast } from "../hooks/useToast.jsx";

export default function Communication() {
  const { projectId } = useParams();
  const [text, setText] = useState("");
  const [comms, setComms] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const toast = useToast();

  const load = async () => {
    try {
      setError(null);
      const data = await listCommunications(projectId);
      setComms(data);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error("Paste some communication text first");
      return;
    }
    setSubmitting(true);
    try {
      const comm = await createCommunication(projectId, text);
      setText("");
      await load();
      toast.success("Communication saved. Click Analyze to extract details.");
      // Auto-trigger analysis for a smoother demo flow
      handleAnalyze(comm.id);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnalyze = async (id) => {
    setAnalyzingId(id);
    try {
      await analyzeCommunication(id);
      toast.success("Analysis complete");
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Communication"
        subtitle="Paste a message, email snippet, or meeting note. AI extracts tasks, responsibilities, deadlines, and decisions."
      />

      <Panel className="mb-6">
        <form onSubmit={submit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder='e.g. "Rahul, please update the electrical drawing by Friday. The client approved the new lighting layout, but we still need approval for the ceiling design."'
            className="w-full border border-line rounded px-3 py-2 text-sm focus:border-amber resize-none"
          />
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-ink text-paper text-sm font-medium px-4 py-2 rounded hover:bg-ink-light disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Analyze Communication"}
            </button>
          </div>
        </form>
      </Panel>

      {error && <ErrorState message={error} />}
      {!error && comms === null && <LoadingState label="Loading history..." />}

      {comms && comms.length === 0 && (
        <EmptyState
          title="No communication logged yet"
          description="Whatever you paste above becomes searchable project memory."
        />
      )}

      {comms && comms.length > 0 && (
        <div className="space-y-4">
          {comms.map((c) => (
            <Panel key={c.id}>
              <p className="text-sm text-ink whitespace-pre-wrap">{c.text}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
                <p className="text-xs text-ink-soft font-mono">
                  {new Date(c.createdAt).toLocaleString()}
                </p>
                {c.analyzed ? (
                  <span className="text-xs text-moss font-medium">
                    Analyzed — {c.summary}
                  </span>
                ) : (
                  <button
                    onClick={() => handleAnalyze(c.id)}
                    disabled={analyzingId === c.id}
                    className="text-xs text-amber-dark font-medium hover:underline disabled:opacity-50"
                  >
                    {analyzingId === c.id ? "Analyzing..." : "Analyze now"}
                  </button>
                )}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
