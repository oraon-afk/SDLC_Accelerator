import type { HealthColor, ImpactLevel, EscalationLikelihood, PriorityLevel } from '../../types/intellipm';

interface HealthBadgeProps {
  status: HealthColor | ImpactLevel | EscalationLikelihood | PriorityLevel | string;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

const colorMap: Record<string, string> = {
  Green: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  Yellow: 'bg-amber-100 text-amber-800 border border-amber-200',
  Red: 'bg-red-100 text-red-800 border border-red-200',
  High: 'bg-red-100 text-red-800 border border-red-200',
  Medium: 'bg-amber-100 text-amber-800 border border-amber-200',
  Low: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  'At risk': 'bg-red-100 text-red-800 border border-red-200',
  'On track': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  Adequate: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  Watch: 'bg-amber-100 text-amber-800 border border-amber-200',
  Overdue: 'bg-red-100 text-red-800 border border-red-200',
  'In Progress': 'bg-blue-100 text-blue-800 border border-blue-200',
  'Not Started': 'bg-slate-100 text-slate-700 border border-slate-200',
  Monitoring: 'bg-purple-100 text-purple-800 border border-purple-200',
  Escalated: 'bg-orange-100 text-orange-800 border border-orange-200',
  Open: 'bg-sky-100 text-sky-800 border border-sky-200',
};

const dotColorMap: Record<string, string> = {
  Green: 'bg-emerald-500',
  Yellow: 'bg-amber-500',
  Red: 'bg-red-500',
  High: 'bg-red-500',
  Medium: 'bg-amber-500',
  Low: 'bg-emerald-500',
};

const sizeMap = {
  sm: 'text-xs px-2 py-0.5 rounded',
  md: 'text-xs px-2.5 py-1 rounded-md',
  lg: 'text-sm px-3 py-1 rounded-md font-semibold',
};

export default function HealthBadge({ status, size = 'md', dot = false }: HealthBadgeProps) {
  const colorClass = colorMap[status] ?? 'bg-slate-100 text-slate-700 border border-slate-200';
  const sizeClass = sizeMap[size];
  const dotColor = dotColorMap[status] ?? 'bg-slate-400';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium ${colorClass} ${sizeClass}`}
      role="status"
      aria-label={`Status: ${status}`}
    >
      {dot && (
        <span
          className={`inline-block w-2 h-2 rounded-full ${dotColor} flex-shrink-0`}
          aria-hidden="true"
        />
      )}
      {status}
    </span>
  );
}
