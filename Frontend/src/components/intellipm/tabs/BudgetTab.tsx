import type { BudgetVariance } from '../../../types/intellipm';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface Props {
  budget: BudgetVariance | null;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="bg-brand-dark/95 border border-brand-primary/50 rounded-lg shadow-lg p-3 backdrop-blur-md"
        role="tooltip"
        aria-live="polite"
      >
        <p className="text-xs font-bold text-white mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }} className="text-xs">
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function BudgetTab({ budget }: Props) {
  if (!budget) {
    return (
      <div className="text-center py-12 text-brand-light/60" role="status" aria-live="polite">
        <DollarSign className="w-12 h-12 text-brand-primary/40 mx-auto mb-3" aria-hidden="true" />
        <p className="text-sm font-medium text-white">No budget data available</p>
        <p className="text-xs text-brand-light/45 mt-1">
          Budget module was not enabled or no budget information was found in the provided artifacts.
        </p>
      </div>
    );
  }

  const {
    total_budget,
    actual_to_date,
    forecast_at_completion,
    variance_percent,
    major_variance_reasons,
  } = budget;

  const remaining_budget = total_budget - actual_to_date;
  const overrun = forecast_at_completion - total_budget;
  const isOverrun = variance_percent > 0;

  const chartData = [
    {
      name: 'Budget Overview',
      'Total Budget': total_budget,
      'Actual To Date': actual_to_date,
      'Forecast at Completion': forecast_at_completion,
    },
  ];

  const utilizationPct = Math.round((actual_to_date / total_budget) * 100);

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        role="region"
        aria-label="Budget key performance indicators"
      >
        {[
          {
            label: 'Total Budget',
            value: formatCurrency(total_budget),
            sub: 'Approved allocation',
            color: 'text-white',
            bg: 'bg-brand-dark/50 border-brand-primary/30 backdrop-blur-md',
            iconColor: 'text-brand-accent bg-brand-primary/20',
          },
          {
            label: 'Actual To Date',
            value: formatCurrency(actual_to_date),
            sub: `${utilizationPct}% utilized`,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10 border-blue-500/30 backdrop-blur-md',
            iconColor: 'text-blue-300 bg-blue-500/20',
          },
          {
            label: 'Forecast at Completion',
            value: formatCurrency(forecast_at_completion),
            sub: isOverrun ? `${variance_percent.toFixed(1)}% over budget` : 'Within budget',
            color: isOverrun ? 'text-red-400' : 'text-emerald-400',
            bg: isOverrun ? 'bg-red-500/10 border-red-500/30 backdrop-blur-md' : 'bg-emerald-500/10 border-emerald-500/30 backdrop-blur-md',
            iconColor: isOverrun ? 'text-red-300 bg-red-500/20' : 'text-emerald-300 bg-emerald-500/20',
          },
          {
            label: isOverrun ? 'Projected Overrun' : 'Remaining Budget',
            value: formatCurrency(isOverrun ? overrun : remaining_budget),
            sub: isOverrun ? 'Requires attention' : 'Available to spend',
            color: isOverrun ? 'text-red-400' : 'text-emerald-400',
            bg: isOverrun ? 'bg-red-500/10 border-red-500/30 backdrop-blur-md' : 'bg-emerald-500/10 border-emerald-500/30 backdrop-blur-md',
            iconColor: isOverrun ? 'text-red-300 bg-red-500/20' : 'text-emerald-300 bg-emerald-500/20',
          },
        ].map(({ label, value, sub, color, bg, iconColor }) => (
          <div
            key={label}
            className={`rounded-xl border p-4 ${bg} shadow-sm`}
            aria-label={`${label}: ${value}. ${sub}`}
          >
            <div className="flex items-start justify-between mb-1">
              <p className="text-xs text-brand-light/75 font-medium">{label}</p>
              <DollarSign className={`w-4 h-4 ${iconColor} rounded p-0.5`} aria-hidden="true" />
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-brand-light/60 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Budget Utilisation Bar */}
      <section
        aria-labelledby="utilisation-heading"
        className="bg-brand-dark/50 rounded-xl border border-brand-primary/30 p-5 shadow-sm backdrop-blur-md"
      >
        <h3
          id="utilisation-heading"
          className="text-sm font-bold text-white mb-4 flex items-center gap-2"
        >
          <TrendingUp className="w-4 h-4 text-brand-accent" aria-hidden="true" />
          Budget Utilisation & Forecast
        </h3>

        {/* Stacked progress bar */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-xs text-brand-light/60">
            <span>Spent: <strong className="text-brand-light">{formatCurrency(actual_to_date)}</strong></span>
            <span>Budget: <strong className="text-brand-light">{formatCurrency(total_budget)}</strong></span>
          </div>
          <div
            className="relative h-8 bg-brand-primary/15 border border-brand-primary/25 rounded-xl overflow-hidden"
            role="progressbar"
            aria-valuenow={utilizationPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Budget utilisation: ${utilizationPct}% spent`}
          >
            {/* Actual spend */}
            <div
              className="absolute left-0 top-0 h-full bg-blue-500/80 border-r border-blue-500 flex items-center px-2 transition-all duration-700"
              style={{ width: `${Math.min(utilizationPct, 100)}%` }}
            >
              <span className="text-white text-xs font-bold">{utilizationPct}%</span>
            </div>
            {/* Forecast overrun indicator */}
            {isOverrun && (
              <div
                className="absolute top-0 h-full bg-red-500/20 border-l-2 border-red-500/85 flex items-center px-1 transition-all duration-700"
                style={{
                  left: '100%',
                  width: `${Math.min(variance_percent, 30)}%`,
                  transform: 'none',
                  maxWidth: '30%',
                }}
                aria-hidden="true"
              >
                <span className="text-red-300 text-xs font-bold">+{variance_percent.toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-brand-light/80">
              <span className="w-3 h-3 rounded bg-blue-500 inline-block" aria-hidden="true" />
              Actual to date
            </span>
            {isOverrun && (
              <span className="flex items-center gap-1.5 text-brand-light/80">
                <span className="w-3 h-3 rounded bg-red-500/60 inline-block" aria-hidden="true" />
                Projected overrun
              </span>
            )}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-56" aria-label="Budget comparison bar chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              barCategoryGap="40%"
              aria-label="Bar chart comparing total budget, actual spend to date, and forecast at completion"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(84, 58, 20, 0.2)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#FFF0DC', opacity: 0.7 }} />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fontSize: 11, fill: '#FFF0DC', opacity: 0.7 }}
                aria-label="Amount in dollars"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: '#FFF0DC' }}
              />
              <ReferenceLine
                y={total_budget}
                stroke="#f87171"
                strokeDasharray="4 4"
                label={{ value: 'Budget Ceiling', fill: '#f87171', fontSize: 10, position: 'top' }}
              />
              <Bar
                dataKey="Total Budget"
                fill="rgba(240, 187, 120, 0.15)"
                stroke="rgba(240, 187, 120, 0.3)"
                strokeWidth={1}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="Actual To Date"
                fill="#60a5fa"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="Forecast at Completion"
                fill={isOverrun ? '#f87171' : '#34d399'}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Variance Reasons */}
      <section
        aria-labelledby="variance-reasons-heading"
        className="bg-brand-dark/50 rounded-xl border border-brand-primary/30 p-4 shadow-sm backdrop-blur-md"
      >
        <h3
          id="variance-reasons-heading"
          className="text-sm font-bold text-white mb-3 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-400" aria-hidden="true" />
          Major Variance Reasons
        </h3>
        {major_variance_reasons.length === 0 ? (
          <p className="text-xs text-brand-light/60">No major variance reasons identified.</p>
        ) : (
          <ul className="space-y-2" aria-label="Major budget variance reasons">
            {major_variance_reasons.map((reason, i) => (
              <li
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
              >
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold flex items-center justify-center mt-0.5"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span className="text-sm text-brand-light">{reason}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
