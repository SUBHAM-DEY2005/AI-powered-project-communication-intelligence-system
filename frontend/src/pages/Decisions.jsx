import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { listDecisions } from "../services/api.js";
import { LoadingState, EmptyState, ErrorState } from "../components/States.jsx";
import { PageHeader, Panel } from "../components/Cards.jsx";
import Badge from "../components/Badge.jsx";

export default function Decisions() {
  const { projectId } = useParams();
  const [decisions, setDecisions] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        setDecisions(await listDecisions(projectId));
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [projectId]);

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
            {decisions.map((d) => (
              <li key={d.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-ink">{d.description}</p>
                  <p className="text-xs text-ink-soft font-mono mt-0.5">
                    {new Date(d.createdAt).toLocaleString()}
                  </p>
                </div>
                <Badge status={d.status} />
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
