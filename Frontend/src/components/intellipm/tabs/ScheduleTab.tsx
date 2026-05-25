import type { ScheduleAlert } from '../../../types/intellipm';
import HealthBadge from '../HealthBadge';
import { Calendar, AlertTriangle, Flag } from 'lucide-react';

interface Props {
  alerts: ScheduleAlert[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Compute a visual bar width based on variance_days relative to max
function getBarWidth(variance: number, max: number): number {
  if (max === 0) return 0;
  return Math.min(100, Math.round((variance / max) * 100));
}

export default function ScheduleTab({ alerts }: Props) {
  const maxVariance = Math.max(...alerts.map((a) => a.variance_days));
  const criticalCount = alerts.filter((a) => a.critical_path_flag).length;
  const totalVarianceDays = alerts.reduce((s, a) => s + a.variance_days, 0);

  return (
    <div className="space-y-5">
      {/* Summary Stats */}
      <div
        className="grid grid-cols-3 gap-3"
        role="region"
        aria-label="Schedule summary statistics"
      >
        {[
          {
            label: 'Milestones At Risk',
            value: alerts.length,
            color: 'text-red-700',
            bg: 'bg-red-50 border-red-200',
          },
          {
            label: 'Critical Path',
            value: criticalCount,
            color: 'text-orange-700',
            bg: 'bg-orange-50 border-orange-200',
          },
          {
            label: 'Total Variance (days)',
            value: totalVarianceDays,
            color: 'text-amber-700',
            bg: 'bg-amber-50 border-amber-200',
          },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            className={`rounded-xl border p-4 ${bg} shadow-sm text-center`}
            aria-label={`${label}: ${value}`}
          >
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Gantt-style Variance Chart */}
      <section
        aria-labelledby="gantt-heading"
        className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
      >
        <h3
          id="gantt-heading"
          className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"
        >
          <Calendar className="w-4 h-4 text-indigo-500" aria-hidden="true" />
          Milestone Variance Chart
        </h3>
        <div
          className="space-y-4"
          role="list"
          aria-label="Milestone variance chart – shows delay in days as horizontal bars"
        >
          {alerts.map((alert, i) => {
            const barPct = getBarWidth(alert.variance_days, maxVariance);
            const barColor =
              alert.critical_path_flag
                ? 'bg-red-500'
                : alert.variance_days >= 10
                ? 'bg-orange-400'
                : 'bg-amber-400';

            return (
              <div key={i} role="listitem" className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    {alert.critical_path_flag && (
                      <Flag
                        className="w-3.5 h-3.5 text-red-500 flex-shrink-0"
                        aria-label="Critical path milestone"
                      />
                    )}
                    <span className="text-sm font-semibold text-slate-800">
                      {alert.milestone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {alert.critical_path_flag && (
                      <HealthBadge status="High" size="sm" />
                    )}
                    <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md border border-red-200">
                      +{alert.variance_days}d
                    </span>
                  </div>
                </div>

                {/* Bar */}
                <div
                  className="relative h-6 bg-slate-100 rounded-lg overflow-hidden"
                  role="img"
                  aria-label={`${alert.milestone}: ${alert.variance_days} day delay`}
                >
                  <div
                    className={`h-full ${barColor} rounded-lg transition-all duration-700 flex items-center px-2`}
                    style={{ width: `${barPct}%` }}
                  >
                    {barPct > 20 && (
                      <span className="text-white text-xs font-semibold">{alert.variance_days}d</span>
                    )}
                  </div>
                </div>

                {/* Date info */}
                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  <span>
                    <span className="font-medium text-slate-700">Baseline:</span>{' '}
                    {formatDate(alert.baseline_date)}
                  </span>
                  <span>
                    <span className="font-medium text-slate-700">Forecast:</span>{' '}
                    {formatDate(alert.forecast_date)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Detailed Table */}
      <section aria-labelledby="schedule-table-heading">
        <h3
          id="schedule-table-heading"
          className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" aria-hidden="true" />
          Schedule Alert Details
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-sm" aria-label="Schedule alerts table">
            <caption className="sr-only">
              Schedule alerts showing milestones, baseline dates, forecast dates, variance, and reasons.
            </caption>
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Milestone
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Baseline
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Forecast
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Variance
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Critical Path
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {alerts.map((alert, i) => (
                <tr key={i} className={`hover:bg-slate-50 transition-colors ${alert.critical_path_flag ? 'bg-red-50/20' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      {alert.critical_path_flag && (
                        <Flag className="w-3.5 h-3.5 text-red-500 flex-shrink-0" aria-hidden="true" />
                      )}
                      {alert.milestone}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs whitespace-nowrap">
                    {formatDate(alert.baseline_date)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs whitespace-nowrap">
                    {formatDate(alert.forecast_date)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                        alert.variance_days >= 10
                          ? 'text-red-700 bg-red-100 border-red-200'
                          : alert.variance_days >= 5
                          ? 'text-amber-700 bg-amber-100 border-amber-200'
                          : 'text-emerald-700 bg-emerald-100 border-emerald-200'
                      }`}
                    >
                      +{alert.variance_days}d
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {alert.critical_path_flag ? (
                      <HealthBadge status="High" size="sm" />
                    ) : (
                      <HealthBadge status="Low" size="sm" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs max-w-xs leading-relaxed">
                    {alert.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
