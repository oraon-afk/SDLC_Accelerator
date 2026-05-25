import type { AnalysisModules, PriorityLevel, TimeHorizon } from '../../types/intellipm';
import {
  ShieldAlert,
  ClipboardList,
  Calendar,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

interface Props {
  modules: AnalysisModules;
  priority: PriorityLevel;
  timeHorizon: TimeHorizon;
  onModulesChange: (modules: AnalysisModules) => void;
  onPriorityChange: (priority: PriorityLevel) => void;
  onTimeHorizonChange: (horizon: TimeHorizon) => void;
}

const MODULE_CONFIG = [
  {
    key: 'riskDetection' as keyof AnalysisModules,
    label: 'Risk Detection',
    description: 'Identifies explicit or latent risks from logs, notes, and status reports.',
    Icon: ShieldAlert,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    checkedBg: 'bg-red-500/20',
  },
  {
    key: 'actionTracking' as keyof AnalysisModules,
    label: 'Action Tracking',
    description: 'Extracts open actions, owners, due dates, and flags overdue items.',
    Icon: ClipboardList,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    checkedBg: 'bg-blue-500/20',
  },
  {
    key: 'scheduleAnalysis' as keyof AnalysisModules,
    label: 'Schedule Analysis',
    description: 'Finds milestone delays, dependencies at risk, critical path deviations.',
    Icon: Calendar,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    checkedBg: 'bg-indigo-500/20',
  },
  {
    key: 'budgetVariance' as keyof AnalysisModules,
    label: 'Budget Variance',
    description: 'Detects cost overruns, resource overspend, and forecast deviations.',
    Icon: DollarSign,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    checkedBg: 'bg-emerald-500/20',
  },
  {
    key: 'escalationPrediction' as keyof AnalysisModules,
    label: 'Escalation Prediction',
    description: 'Uses sentiment and delays to predict escalation likelihood.',
    Icon: TrendingUp,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    checkedBg: 'bg-orange-500/20',
  },
];

export default function AnalysisConfig({
  modules,
  priority,
  timeHorizon,
  onModulesChange,
  onPriorityChange,
  onTimeHorizonChange,
}: Props) {
  const handleModuleToggle = (key: keyof AnalysisModules) => {
    onModulesChange({ ...modules, [key]: !modules[key] });
  };

  const atLeastOneEnabled = Object.values(modules).some(Boolean);

  return (
    <fieldset className="space-y-4">
      <legend className="sr-only">Analysis configuration</legend>

      {/* Module Toggles */}
      <div>
        <p
          className="text-sm font-semibold text-brand-light mb-3"
          id="modules-label"
        >
          Analysis Modules
        </p>
        {!atLeastOneEnabled && (
          <p role="alert" className="text-xs text-red-400 mb-3 flex items-center gap-1">
            <span aria-hidden="true">⚠</span> Please select at least one analysis module.
          </p>
        )}
        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          role="group"
          aria-labelledby="modules-label"
        >
          {MODULE_CONFIG.map(({ key, label, description, Icon, color, bg, border, checkedBg }) => {
            const checked = modules[key];
            const checkboxId = `module-${key}`;
            return (
              <label
                key={key}
                htmlFor={checkboxId}
                className={`
                  relative flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150
                  focus-within:ring-2 focus-within:ring-brand-accent focus-within:ring-offset-1 focus-within:ring-offset-brand-dark
                  ${checked ? `${checkedBg} ${border}` : 'bg-brand-primary/10 border-brand-primary/30 hover:border-brand-primary/50'}
                `}
              >
                <input
                  type="checkbox"
                  id={checkboxId}
                  checked={checked}
                  onChange={() => handleModuleToggle(key)}
                  className="sr-only"
                  aria-describedby={`${checkboxId}-desc`}
                />
                {/* Custom checkbox visual */}
                <span
                  className={`
                    mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                    ${checked ? 'bg-brand-accent border-brand-accent' : 'border-brand-primary/50 bg-brand-primary/10'}
                  `}
                  aria-hidden="true"
                >
                  {checked && (
                    <svg className="w-3 h-3 text-brand-dark" fill="none" viewBox="0 0 12 12">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} aria-hidden="true" />
                    <span className="text-sm font-semibold text-brand-light">{label}</span>
                  </div>
                  <p
                    id={`${checkboxId}-desc`}
                    className="text-xs text-brand-light/60 mt-0.5 leading-relaxed"
                  >
                    {description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Priority + Time Horizon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div>
          <label
            htmlFor="priority-select"
            className="block text-sm font-semibold text-brand-light mb-1.5"
          >
            Priority Level
          </label>
          <select
            id="priority-select"
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value as PriorityLevel)}
            className="w-full rounded-lg border border-brand-primary/30 bg-brand-dark px-3 py-2 text-sm text-brand-light shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition-colors"
          >
            <option value="Low">Low – Critical items only</option>
            <option value="Medium">Medium – Standard alerts</option>
            <option value="High">High – Granular detail</option>
          </select>
          <p className="text-xs text-brand-light/50 mt-1">
            Influences the LLM's sensitivity and level of detail.
          </p>
        </div>
        <div>
          <label
            htmlFor="horizon-select"
            className="block text-sm font-semibold text-brand-light mb-1.5"
          >
            Time Horizon
          </label>
          <select
            id="horizon-select"
            value={timeHorizon}
            onChange={(e) => onTimeHorizonChange(e.target.value as TimeHorizon)}
            className="w-full rounded-lg border border-brand-primary/30 bg-brand-dark px-3 py-2 text-sm text-brand-light shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition-colors"
          >
            <option value="Next 2 weeks">Next 2 Weeks</option>
            <option value="1 month">1 Month</option>
            <option value="Entire project">Entire Project</option>
          </select>
          <p className="text-xs text-brand-light/50 mt-1">
            Scope of milestones and forecasts included in analysis.
          </p>
        </div>
      </div>
    </fieldset>
  );
}
