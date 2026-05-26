import type { AnalysisResult } from '../../../types/intellipm';
import HealthBadge from '../HealthBadge';
import ConfidenceBar from '../ConfidenceBar';
import {
  ShieldAlert,
  ClipboardList,
  TrendingUp,
  FileText,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface Props {
  result: AnalysisResult;
  onTabChange: (tab: string) => void;
}

function HealthIndicator({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-brand-primary/20 last:border-0">
      <span className="text-sm text-brand-light/75">{label}</span>
      <HealthBadge status={value} size="sm" />
    </div>
  );
}

export default function ExecutiveSummary({ result, onTabChange }: Props) {
  const {
    project_health_summary,
    top_actions,
    risks,
    escalation_prediction,
    confidence_scores,
    action_tracker,
    source_artifacts,
    analysis_timestamp,
    priority_level,
  } = result;

  const overdue = action_tracker.overdue_actions;
  const ts = new Date(analysis_timestamp).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const escalationColor =
    escalation_prediction?.likelihood === 'High'
      ? 'bg-red-500/10 border-red-500/30 text-red-400'
      : escalation_prediction?.likelihood === 'Medium'
      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';

  return (
    <div className="space-y-6">
      {/* Header meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-brand-light/60">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          Analysed: {ts}
        </span>
        <span>·</span>
        <span>Priority: <strong className="text-white">{priority_level}</strong></span>
        <span>·</span>
        <span>Sources: <strong className="text-white">{source_artifacts.length} artifact{source_artifacts.length !== 1 ? 's' : ''}</strong></span>
      </div>

      {/* Overall Health Banner */}
      <section
        aria-labelledby="health-banner-heading"
        className={`rounded-2xl p-5 border ${
          project_health_summary.overall_health === 'Green'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : project_health_summary.overall_health === 'Yellow'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h2
            id="health-banner-heading"
            className="text-lg font-bold text-white flex items-center gap-2"
          >
            Overall Project Health
          </h2>
          <HealthBadge status={project_health_summary.overall_health} size="lg" dot />
        </div>
        <p className="text-sm text-brand-light/90 leading-relaxed">
          {project_health_summary.narrative}
        </p>
      </section>

      {/* Health Factors + Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Health Factors */}
        <section
          aria-labelledby="health-factors-heading"
          className="bg-brand-dark/50 rounded-xl border border-brand-primary/30 p-4 shadow-sm backdrop-blur-md"
        >
          <h3
            id="health-factors-heading"
            className="text-sm font-bold text-white mb-3 flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-brand-accent" aria-hidden="true" />
            Health Factors
          </h3>
          <div>
            <HealthIndicator label="Schedule" value={project_health_summary.health_factors.schedule} />
            <HealthIndicator label="Budget" value={project_health_summary.health_factors.budget} />
            <HealthIndicator label="Resources" value={project_health_summary.health_factors.resources} />
            <HealthIndicator label="Quality" value={project_health_summary.health_factors.quality} />
          </div>
        </section>

        {/* Action Snapshot */}
        <section
          aria-labelledby="action-snapshot-heading"
          className="bg-brand-dark/50 rounded-xl border border-brand-primary/30 p-4 shadow-sm backdrop-blur-md"
        >
          <h3
            id="action-snapshot-heading"
            className="text-sm font-bold text-white mb-3 flex items-center gap-2"
          >
            <ClipboardList className="w-4 h-4 text-brand-accent" aria-hidden="true" />
            Action Tracker Snapshot
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Actions', value: action_tracker.total_actions, color: 'text-white' },
              { label: 'Open Actions', value: action_tracker.open_actions, color: 'text-brand-accent' },
              {
                label: 'Overdue',
                value: overdue,
                color: overdue > 0 ? 'text-red-400' : 'text-emerald-400',
              },
              {
                label: 'Avg Age (days)',
                value: action_tracker.avg_age_open_days.toFixed(1),
                color: 'text-amber-400',
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-2 bg-brand-primary/10 border border-brand-primary/20 rounded-lg">
                <p className={`text-2xl font-bold ${color}`} aria-label={`${label}: ${value}`}>
                  {value}
                </p>
                <p className="text-xs text-brand-light/60 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => onTabChange('actions')}
            className="mt-3 w-full text-xs text-brand-accent font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded"
            aria-label="View all actions in Action Tracker tab"
          >
            View all actions →
          </button>
        </section>
      </div>

      {/* Top 3 Actions */}
      {top_actions.length > 0 && (
        <section aria-labelledby="top-actions-heading">
          <h3
            id="top-actions-heading"
            className="text-sm font-bold text-white mb-3 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-brand-accent" aria-hidden="true" />
            Top Priority Actions
          </h3>
          <div className="space-y-2" role="list">
            {top_actions.slice(0, 3).map((action, i) => (
              <div
                key={i}
                role="listitem"
                className="flex flex-wrap items-start gap-3 p-3 rounded-xl bg-brand-dark/50 border border-brand-primary/30 shadow-sm backdrop-blur-md"
              >
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-primary/30 text-brand-accent border border-brand-primary/20 text-xs font-bold flex items-center justify-center mt-0.5"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{action.action}</p>
                  <p className="text-xs text-brand-light/60 mt-0.5">
                    Owner: <span className="font-medium text-brand-light">{action.owner}</span>
                    {' · '}Due:{' '}
                    <span className="font-medium text-brand-light">{action.due_date}</span>
                    {' · '}Age: <span className="font-medium text-brand-light">{action.age_days}d</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <HealthBadge status={action.status} size="sm" />
                  <HealthBadge status={action.priority} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top 3 Risks */}
      {risks.length > 0 && (
        <section aria-labelledby="top-risks-heading">
          <h3
            id="top-risks-heading"
            className="text-sm font-bold text-white mb-3 flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 text-red-400" aria-hidden="true" />
            Top Risks
          </h3>
          <div className="space-y-2" role="list">
            {risks.slice(0, 3).map((risk, i) => (
              <div
                key={i}
                role="listitem"
                className="p-3 rounded-xl bg-brand-dark/50 border border-brand-primary/30 shadow-sm backdrop-blur-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-white flex-1">{risk.risk}</p>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <span className="text-xs text-brand-light/60">Impact:</span>
                    <HealthBadge status={risk.impact} size="sm" />
                    <span className="text-xs text-brand-light/60">Prob:</span>
                    <HealthBadge status={risk.probability} size="sm" />
                  </div>
                </div>
                <p className="text-xs text-brand-light/85">
                  <span className="font-medium text-brand-accent">Mitigation:</span> {risk.mitigation}
                </p>
              </div>
            ))}
          </div>
          <button
            onClick={() => onTabChange('risks')}
            className="mt-2 text-xs text-brand-accent font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded"
            aria-label="View all risks in Risks tab"
          >
            View all {risks.length} risks →
          </button>
        </section>
      )}

      {/* Escalation Prediction */}
      {escalation_prediction && (
        <section
          aria-labelledby="escalation-heading"
          className={`rounded-xl border p-4 ${escalationColor}`}
        >
          <h3
            id="escalation-heading"
            className="text-sm font-bold mb-2 flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" aria-hidden="true" />
            Escalation Prediction:{' '}
            <HealthBadge status={escalation_prediction.likelihood} size="sm" />
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="font-semibold text-xs mb-1 uppercase tracking-wide opacity-70 text-brand-light/80">
                Indicators
              </p>
              <ul className="space-y-1" aria-label="Escalation indicators">
                {escalation_prediction.indicators.map((ind, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-brand-light/90">
                    <span aria-hidden="true" className="mt-0.5 flex-shrink-0">•</span>
                    {ind}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-xs mb-1 uppercase tracking-wide opacity-70 text-brand-light/80">
                Recommended Actions
              </p>
              <ul className="space-y-1" aria-label="Recommended escalation actions">
                {escalation_prediction.recommended_actions.map((rec, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-brand-light/90">
                    <span aria-hidden="true" className="mt-0.5 flex-shrink-0">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Confidence Scores */}
      <section
        aria-labelledby="confidence-heading"
        className="bg-brand-dark/50 rounded-xl border border-brand-primary/30 p-4 shadow-sm backdrop-blur-md"
      >
        <h3
          id="confidence-heading"
          className="text-sm font-bold text-white mb-3"
        >
          AI Confidence Scores
        </h3>
        <div className="space-y-3">
          <ConfidenceBar label="Overall Analysis" score={confidence_scores.overall} />
          <ConfidenceBar label="Risk Detection" score={confidence_scores.risk_detection} />
          <ConfidenceBar label="Action Tracking" score={confidence_scores.action_tracking} />
          <ConfidenceBar label="Schedule Analysis" score={confidence_scores.schedule_analysis} />
        </div>
      </section>

      {/* Source Artifacts */}
      <section aria-labelledby="sources-heading" className="bg-brand-dark/50 rounded-xl border border-brand-primary/30 p-4 shadow-sm backdrop-blur-md">
        <h3 id="sources-heading" className="text-sm font-bold text-white mb-2">
          Source Artifacts Analysed
        </h3>
        <ul className="flex flex-wrap gap-2" aria-label="Source files used in this analysis">
          {source_artifacts.map((artifact, i) => (
            <li key={i}>
              <span className="inline-flex items-center gap-1 text-xs bg-brand-primary/20 text-brand-light border border-brand-primary/30 rounded-md px-2 py-1 font-mono">
                <FileText className="w-3 h-3 text-brand-accent" aria-hidden="true" />
                {artifact}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
