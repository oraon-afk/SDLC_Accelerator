import { useState } from 'react';
import type { AnalysisResult, TabId } from '../../types/intellipm';
import ExecutiveSummary from './tabs/ExecutiveSummary';
import RisksTab from './tabs/RisksTab';
import ActionTrackerTab from './tabs/ActionTrackerTab';
import ScheduleTab from './tabs/ScheduleTab';
import BudgetTab from './tabs/BudgetTab';
import ExportTab from './tabs/ExportTab';
import {
  LayoutDashboard,
  ShieldAlert,
  ClipboardList,
  Calendar,
  DollarSign,
  Download,
  ArrowLeft,
} from 'lucide-react';

interface Props {
  result: AnalysisResult;
  onBack: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

const TABS: {
  id: TabId;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  badge?: (r: AnalysisResult) => string | number | null;
}[] = [
  {
    id: 'summary',
    label: 'Executive Summary',
    shortLabel: 'Summary',
    icon: LayoutDashboard,
  },
  {
    id: 'risks',
    label: 'Risks',
    shortLabel: 'Risks',
    icon: ShieldAlert,
    badge: (r) => r.risks.length,
  },
  {
    id: 'actions',
    label: 'Action Tracker',
    shortLabel: 'Actions',
    icon: ClipboardList,
    badge: (r) => r.action_tracker.overdue_actions > 0 ? `${r.action_tracker.overdue_actions} overdue` : r.top_actions.length,
  },
  {
    id: 'schedule',
    label: 'Schedule Alerts',
    shortLabel: 'Schedule',
    icon: Calendar,
    badge: (r) => r.schedule_alerts.length,
  },
  {
    id: 'budget',
    label: 'Budget Insights',
    shortLabel: 'Budget',
    icon: DollarSign,
    badge: (r) => r.budget_variance ? `${r.budget_variance.variance_percent.toFixed(1)}%` : null,
  },
  {
    id: 'export',
    label: 'Export',
    shortLabel: 'Export',
    icon: Download,
  },
];

export default function ResultsDashboard({ result, onBack, onRegenerate, isRegenerating }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('summary');

  const handleTabChange = (tab: string) => setActiveTab(tab as TabId);

  const healthColor =
    result.project_health_summary.overall_health === 'Green'
      ? 'bg-emerald-500'
      : result.project_health_summary.overall_health === 'Yellow'
      ? 'bg-amber-500'
      : 'bg-red-500';

  return (
    <div className="space-y-0">
      {/* Results Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-brand-light/60 hover:text-white font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded-md px-2 py-1 hover:bg-brand-primary/20 transition-colors"
            aria-label="Go back to agent workspace to upload new artifacts"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            New Analysis
          </button>
          <span className="text-brand-primary/50" aria-hidden="true">|</span>
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${healthColor} flex-shrink-0`}
              aria-hidden="true"
            />
            <h2 className="text-sm font-bold text-brand-light">
              Project Health:{' '}
              <span
                className={
                  result.project_health_summary.overall_health === 'Green'
                    ? 'text-emerald-400'
                    : result.project_health_summary.overall_health === 'Yellow'
                    ? 'text-amber-400'
                    : 'text-red-400'
                }
              >
                {result.project_health_summary.overall_health}
              </span>
            </h2>
          </div>
        </div>
        <p className="text-xs text-brand-light/50">
          Analysed {result.source_artifacts.length} artifact{result.source_artifacts.length !== 1 ? 's' : ''}
          {' · '}
          {new Date(result.analysis_timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Tab Navigation */}
      <nav
        aria-label="Results dashboard navigation"
        className="mb-5"
      >
        <div
          className="flex overflow-x-auto scrollbar-hide gap-1 p-1 bg-brand-primary/20 rounded-xl"
          role="tablist"
          aria-label="Analysis result sections"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const badge = tab.badge?.(result);
            const Icon = tab.icon;

            // Highlight overdue badge in red
            const isOverdueBadge =
              tab.id === 'actions' &&
              result.action_tracker.overdue_actions > 0 &&
              typeof badge === 'string' &&
              badge.includes('overdue');

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0
                  transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-1 focus-visible:ring-offset-brand-dark
                  ${isActive
                    ? 'bg-brand-primary/40 text-brand-accent shadow-sm border border-brand-primary/30'
                    : 'text-brand-light/60 hover:text-brand-light hover:bg-brand-primary/30'
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
                {badge !== null && badge !== undefined && (
                  <span
                    className={`
                      ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold leading-none
                      ${isOverdueBadge
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : isActive
                        ? 'bg-brand-accent/20 text-brand-accent'
                        : 'bg-brand-dark/50 text-brand-light/50 border border-brand-primary/30'
                      }
                    `}
                    aria-label={`${badge}${typeof badge === 'number' ? ' items' : ''}`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Tab Panels */}
      <div>
        <div
          id="tabpanel-summary"
          role="tabpanel"
          aria-labelledby="tab-summary"
          tabIndex={0}
          hidden={activeTab !== 'summary'}
          className={activeTab === 'summary' ? 'block focus:outline-none' : 'hidden'}
        >
          {activeTab === 'summary' && (
            <ExecutiveSummary result={result} onTabChange={handleTabChange} />
          )}
        </div>

        <div
          id="tabpanel-risks"
          role="tabpanel"
          aria-labelledby="tab-risks"
          tabIndex={0}
          hidden={activeTab !== 'risks'}
          className={activeTab === 'risks' ? 'block focus:outline-none' : 'hidden'}
        >
          {activeTab === 'risks' && <RisksTab risks={result.risks} />}
        </div>

        <div
          id="tabpanel-actions"
          role="tabpanel"
          aria-labelledby="tab-actions"
          tabIndex={0}
          hidden={activeTab !== 'actions'}
          className={activeTab === 'actions' ? 'block focus:outline-none' : 'hidden'}
        >
          {activeTab === 'actions' && (
            <ActionTrackerTab actions={result.top_actions} tracker={result.action_tracker} />
          )}
        </div>

        <div
          id="tabpanel-schedule"
          role="tabpanel"
          aria-labelledby="tab-schedule"
          tabIndex={0}
          hidden={activeTab !== 'schedule'}
          className={activeTab === 'schedule' ? 'block focus:outline-none' : 'hidden'}
        >
          {activeTab === 'schedule' && <ScheduleTab alerts={result.schedule_alerts} />}
        </div>

        <div
          id="tabpanel-budget"
          role="tabpanel"
          aria-labelledby="tab-budget"
          tabIndex={0}
          hidden={activeTab !== 'budget'}
          className={activeTab === 'budget' ? 'block focus:outline-none' : 'hidden'}
        >
          {activeTab === 'budget' && (
            <BudgetTab budget={result.budget_variance} />
          )}
        </div>

        <div
          id="tabpanel-export"
          role="tabpanel"
          aria-labelledby="tab-export"
          tabIndex={0}
          hidden={activeTab !== 'export'}
          className={activeTab === 'export' ? 'block focus:outline-none' : 'hidden'}
        >
          {activeTab === 'export' && (
            <ExportTab
              result={result}
              onRegenerate={onRegenerate}
              isRegenerating={isRegenerating}
            />
          )}
        </div>
      </div>
    </div>
  );
}
