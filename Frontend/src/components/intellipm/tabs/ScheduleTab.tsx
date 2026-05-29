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
  if (!alerts || alerts.length === 0) {
    return (
      <div className="space-y-5">
        <div className="bg-brand-dark/50 rounded-xl border border-brand-primary/30 p-8 shadow-sm backdrop-blur-md text-center">
          <Calendar className="w-10 h-10 text-brand-light/30 mx-auto mb-3" />
          <p className="text-sm text-brand-light/60 italic">No schedule alerts available from the analysis.</p>
        </div>
      </div>
    );
  }

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
            color: 'text-red-400',
            bg: 'bg-red-500/10 border-red-500/30 backdrop-blur-md',
          },
          {
            label: 'Critical Path',
            value: criticalCount,
            color: 'text-orange-400',
            bg: 'bg-orange-500/10 border-orange-500/30 backdrop-blur-md',
          },
          {
            label: 'Total Variance (days)',
            value: totalVarianceDays,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/30 backdrop-blur-md',
          },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            className={`rounded-xl border p-4 ${bg} shadow-sm text-center`}
            aria-label={`${label}: ${value}`}
          >
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-brand-light/60 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Gantt-style Variance Chart */}
      <section
        aria-labelledby="gantt-heading"
        className="bg-brand-dark/50 rounded-xl border border-brand-primary/30 p-5 shadow-sm backdrop-blur-md"
      >
        <h3
          id="gantt-heading"
          className="text-sm font-bold text-white mb-4 flex items-center gap-2"
        >
          <Calendar className="w-4 h-4 text-brand-accent" aria-hidden="true" />
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
                ? 'bg-red-500/80 border border-red-500/90'
                : alert.variance_days >= 10
                ? 'bg-orange-500/80 border border-orange-500/90'
                : 'bg-brand-accent';

            return (
              <div key={i} role="listitem" className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    {alert.critical_path_flag && (
                      <Flag
                        className="w-3.5 h-3.5 text-red-400 flex-shrink-0"
                        aria-label="Critical path milestone"
                      />
                    )}
                    <span className="text-sm font-semibold text-white">
                      {alert.milestone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {alert.critical_path_flag && (
                      <HealthBadge status="High" size="sm" />
                    )}
                    <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/30">
                      +{alert.variance_days}d
                    </span>
                  </div>
                </div>

                {/* Bar */}
                <div
                  className="relative h-6 bg-brand-primary/15 border border-brand-primary/25 rounded-lg overflow-hidden"
                  role="img"
                  aria-label={`${alert.milestone}: ${alert.variance_days} day delay`}
                >
                  <div
                    className={`h-full ${barColor} rounded-lg transition-all duration-700 flex items-center px-2`}
                    style={{ width: `${barPct}%` }}
                  >
                    {barPct > 20 && (
                      <span className={`${alert.critical_path_flag || alert.variance_days >= 10 ? 'text-white' : 'text-brand-dark'} text-xs font-bold`}>{alert.variance_days}d</span>
                    )}
                  </div>
                </div>

                {/* Date info */}
                <div className="flex flex-wrap gap-4 text-xs text-brand-light/65">
                  <span>
                    <span className="font-semibold text-brand-light/85">Baseline:</span>{' '}
                    {formatDate(alert.baseline_date)}
                  </span>
                  <span>
                    <span className="font-semibold text-brand-light/85">Forecast:</span>{' '}
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
          className="text-sm font-bold text-white mb-3 flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-brand-accent" aria-hidden="true" />
          Schedule Alert Details
        </h3>
        <div className="overflow-x-auto rounded-xl border border-brand-primary/30 shadow-md bg-brand-dark/50 backdrop-blur-md">
          <table className="w-full text-sm" aria-label="Schedule alerts table">
            <caption className="sr-only">
              Schedule alerts showing milestones, baseline dates, forecast dates, variance, and reasons.
            </caption>
            <thead className="bg-brand-primary/20">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-brand-light/85 uppercase tracking-wider">
                  Milestone
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-brand-light/85 uppercase tracking-wider">
                  Baseline
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-brand-light/85 uppercase tracking-wider">
                  Forecast
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-brand-light/85 uppercase tracking-wider">
                  Variance
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-brand-light/85 uppercase tracking-wider">
                  Critical Path
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-brand-light/85 uppercase tracking-wider">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-primary/20 bg-transparent">
              {alerts.map((alert, i) => (
                <tr key={i} className={`hover:bg-brand-primary/10 transition-colors ${alert.critical_path_flag ? 'bg-red-500/5' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-white">
                    <span className="flex items-center gap-1.5">
                      {alert.critical_path_flag && (
                        <Flag className="w-3.5 h-3.5 text-red-400 flex-shrink-0" aria-hidden="true" />
                      )}
                      {alert.milestone}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-light/80 font-mono text-xs whitespace-nowrap">
                    {formatDate(alert.baseline_date)}
                  </td>
                  <td className="px-4 py-3 text-brand-light/80 font-mono text-xs whitespace-nowrap">
                    {formatDate(alert.forecast_date)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                        alert.variance_days >= 10
                          ? 'text-red-400 bg-red-500/10 border-red-500/30'
                          : alert.variance_days >= 5
                          ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                          : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
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
                  <td className="px-4 py-3 text-brand-light/85 text-xs max-w-xs leading-relaxed">
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
