const TONES = {
  pending: "bg-amber/15 text-amber-dark border-amber/30",
  in_progress: "bg-ink/10 text-ink border-ink/20",
  completed: "bg-moss-light text-moss border-moss/30",
  approved: "bg-moss-light text-moss border-moss/30",
  rejected: "bg-clay-light text-clay border-clay/30",
};

const LABELS = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  approved: "Approved",
  rejected: "Rejected",
};

export default function Badge({ status }) {
  const tone = TONES[status] || "bg-line/40 text-ink-soft border-line";
  const label = LABELS[status] || status;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border ${tone}`}
    >
      {label}
    </span>
  );
}
