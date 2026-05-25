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
        className="bg-white border border-slate-200 rounded-lg shadow-lg p-3"
        role="tooltip"
        aria-live="polite"
      >
        <p className="text-xs font-bold text-slate-700 mb-1">{label}</p>
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
      <div className="text-center py-12 text-slate-500" role="status" aria-live="polite">
        <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" aria-hidden="true" />
        <p className="text-sm font-medium">No budget data available</p>
        <p className="text-xs text-slate-400 mt-1">
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
            color: 'text-slate-800',
            bg: 'bg-slate-50 border-slate-200',
            iconColor: 'text-slate-600 bg-slate-100',
          },
          {
            label: 'Actual To Date',
            value: formatCurrency(actual_to_date),
            sub: `${utilizationPct}% utilized`,
            color: 'text-blue-700',
            bg: 'bg-blue-50 border-blue-200',
            iconColor: 'text-blue-600 bg-blue-100',
          },
          {
            label: 'Forecast at Completion',
            value: formatCurrency(forecast_at_completion),
            sub: isOverrun ? `${variance_percent.toFixed(1)}% over budget` : 'Within budget',
            color: isOverrun ? 'text-red-700' : 'text-emerald-700',
            bg: isOverrun ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200',
            iconColor: isOverrun ? 'text-red-600 bg-red-100' : 'text-emerald-600 bg-emerald-100',
          },
          {
            label: isOverrun ? 'Projected Overrun' : 'Remaining Budget',
            value: formatCurrency(isOverrun ? overrun : remaining_budget),
            sub: isOverrun ? 'Requires attention' : 'Available to spend',
            color: isOverrun ? 'text-red-700' : 'text-emerald-700',
            bg: isOverrun ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200',
            iconColor: isOverrun ? 'text-red-600 bg-red-100' : 'text-emerald-600 bg-emerald-100',
          },
        ].map(({ label, value, sub, color, bg, iconColor }) => (
          <div
            key={label}
            className={`rounded-xl border p-4 ${bg} shadow-sm`}
            aria-label={`${label}: ${value}. ${sub}`}
          >
            <div className="flex items-start justify-between mb-1">
              <p className="text-xs text-slate-600 font-medium">{label}</p>
              <DollarSign className={`w-4 h-4 ${iconColor} rounded p-0.5`} aria-hidden="true" />
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Budget Utilisation Bar */}
      <section
        aria-labelledby="utilisation-heading"
        className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
      >
        <h3
          id="utilisation-heading"
          className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"
        >
          <TrendingUp className="w-4 h-4 text-indigo-500" aria-hidden="true" />
          Budget Utilisation & Forecast
        </h3>

        {/* Stacked progress bar */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Spent: <strong className="text-slate-700">{formatCurrency(actual_to_date)}</strong></span>
            <span>Budget: <strong className="text-slate-700">{formatCurrency(total_budget)}</strong></span>
          </div>
          <div
            className="relative h-8 bg-slate-100 rounded-xl overflow-hidden"
            role="progressbar"
            aria-valuenow={utilizationPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Budget utilisation: ${utilizationPct}% spent`}
          >
            {/* Actual spend */}
            <div
              className="absolute left-0 top-0 h-full bg-blue-500 flex items-center px-2 transition-all duration-700"
              style={{ width: `${Math.min(utilizationPct, 100)}%` }}
            >
              <span className="text-white text-xs font-bold">{utilizationPct}%</span>
            </div>
            {/* Forecast overrun indicator */}
            {isOverrun && (
              <div
                className="absolute top-0 h-full bg-red-400/60 border-l-2 border-red-500 flex items-center px-1 transition-all duration-700"
                style={{
                  left: '100%',
                  width: `${Math.min(variance_percent, 30)}%`,
                  transform: 'none',
                  maxWidth: '30%',
                }}
                aria-hidden="true"
              >
                <span className="text-red-800 text-xs font-bold">+{variance_percent.toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-500 inline-block" aria-hidden="true" />
              Actual to date
            </span>
            {isOverrun && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-red-400 inline-block" aria-hidden="true" />
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
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fontSize: 11, fill: '#64748b' }}
                aria-label="Amount in dollars"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              />
              <ReferenceLine
                y={total_budget}
                stroke="#e11d48"
                strokeDasharray="4 4"
                label={{ value: 'Budget Ceiling', fill: '#e11d48', fontSize: 10 }}
              />
              <Bar
                dataKey="Total Budget"
                fill="#e2e8f0"
                stroke="#cbd5e1"
                strokeWidth={1}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="Actual To Date"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="Forecast at Completion"
                fill={isOverrun ? '#ef4444' : '#10b981'}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Variance Reasons */}
      <section
        aria-labelledby="variance-reasons-heading"
        className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
      >
        <h3
          id="variance-reasons-heading"
          className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-500" aria-hidden="true" />
          Major Variance Reasons
        </h3>
        {major_variance_reasons.length === 0 ? (
          <p className="text-xs text-slate-500">No major variance reasons identified.</p>
        ) : (
          <ul className="space-y-2" aria-label="Major budget variance reasons">
            {major_variance_reasons.map((reason, i) => (
              <li
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-100"
              >
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center mt-0.5"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span className="text-sm text-slate-700">{reason}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
