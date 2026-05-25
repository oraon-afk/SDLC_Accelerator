interface ConfidenceBarProps {
  label: string;
  score: number;
}

export default function ConfidenceBar({ label, score }: ConfidenceBarProps) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="text-sm font-semibold text-slate-800" aria-live="polite">
          {pct}%
        </span>
      </div>
      <div
        className="h-2 bg-slate-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} confidence: ${pct}%`}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
