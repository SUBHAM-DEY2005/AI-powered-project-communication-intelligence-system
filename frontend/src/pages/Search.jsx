import { useState } from "react";
import { useParams } from "react-router-dom";
import { searchProject } from "../services/api.js";
import { LoadingState, EmptyState, ErrorState } from "../components/States.jsx";
import { PageHeader, Panel } from "../components/Cards.jsx";
import Badge from "../components/Badge.jsx";

export default function Search() {
  const { projectId } = useParams();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await searchProject(projectId, query.trim());
      setResults(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Search Project Memory"
        subtitle='Try: "Who approved the lighting layout?" or "What tasks are assigned to Rahul?"'
      />

      <form onSubmit={submit} className="flex gap-2 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search communications, tasks, and decisions..."
          className="flex-1 border border-line rounded px-3 py-2 text-sm focus:border-amber"
        />
        <button
          type="submit"
          className="bg-ink text-paper text-sm font-medium px-4 py-2 rounded hover:bg-ink-light"
        >
          Search
        </button>
      </form>

      {error && <ErrorState message={error} />}
      {loading && <LoadingState label="Searching..." />}

      {!loading && results && results.totalResults === 0 && (
        <EmptyState
          title="No results"
          description={`Nothing in this project's memory matches "${results.query}".`}
        />
      )}

      {!loading && results && results.totalResults > 0 && (
        <div className="space-y-4">
          {results.communications.length > 0 && (
            <Panel title="Communications">
              <ul className="space-y-3">
                {results.communications.map((c) => (
                  <li key={c.id} className="border-b border-line last:border-0 pb-3 last:pb-0">
                    <p className="text-sm text-ink">{c.summary || c.text}</p>
                    <p className="text-xs text-ink-soft font-mono mt-1">
                      Source: communication on {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {results.tasks.length > 0 && (
            <Panel title="Tasks">
              <ul className="space-y-3">
                {results.tasks.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-ink">{t.title}</p>
                      <p className="text-xs text-ink-soft font-mono">
                        {t.responsible} · due {t.deadline}
                      </p>
                    </div>
                    <Badge status={t.status} />
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {results.decisions.length > 0 && (
            <Panel title="Decisions">
              <ul className="space-y-3">
                {results.decisions.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3">
                    <p className="text-sm text-ink">{d.description}</p>
                    <Badge status={d.status} />
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}
