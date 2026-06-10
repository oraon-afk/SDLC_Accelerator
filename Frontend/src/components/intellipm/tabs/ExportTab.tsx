import type { AnalysisResult } from '../../../types/intellipm';
import { Download, FileText, Table2, RefreshCw, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface Props {
  result: AnalysisResult;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

function exportActionsCSV(result: AnalysisResult) {
  const headers = ['Action', 'Owner', 'Due Date', 'Status', 'Age (days)', 'Priority'];
  const rows = result.top_actions.map((a) => [
    `"${a.action}"`,
    `"${a.owner}"`,
    a.due_date,
    a.status,
    a.age_days,
    a.priority,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadText(csv, 'action_tracker.csv', 'text/csv');
}

function exportRisksCSV(result: AnalysisResult) {
  const headers = ['Risk', 'Impact', 'Probability', 'Mitigation', 'Owner', 'Status'];
  const rows = result.risks.map((r) => [
    `"${r.risk}"`,
    r.impact,
    r.probability,
    `"${r.mitigation}"`,
    `"${r.owner}"`,
    r.status,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadText(csv, 'risk_register.csv', 'text/csv');
}

function exportFullJSON(result: AnalysisResult) {
  const json = JSON.stringify(result, null, 2);
  downloadText(json, 'intellipm_analysis.json', 'application/json');
}

function exportTextReport(result: AnalysisResult): string {
  const ts = new Date(result.analysis_timestamp).toLocaleString('en-GB', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const lines: string[] = [
    '================================================================',
    '          INTELLI-PM PROJECT HEALTH INTELLIGENCE REPORT',
    '================================================================',
    '',
    `Analysis Date:   ${ts}`,
    `Priority Level:  ${result.priority_level}`,
    `Source Files:    ${(result.source_artifacts ?? []).join(', ')}`,
    '',
    '----------------------------------------------------------------',
    '1. EXECUTIVE SUMMARY',
    '----------------------------------------------------------------',
    `Overall Health: ${result.project_health_summary.overall_health}`,
    '',
    result.project_health_summary.narrative,
    '',
    'Health Factors:',
    `  Schedule:   ${result.project_health_summary.health_factors.schedule}`,
    `  Budget:     ${result.project_health_summary.health_factors.budget}`,
    `  Resources:  ${result.project_health_summary.health_factors.resources}`,
    `  Quality:    ${result.project_health_summary.health_factors.quality}`,
    '',
  ];

  if (result.escalation_prediction) {
    lines.push('----------------------------------------------------------------');
    lines.push('2. ESCALATION PREDICTION');
    lines.push('----------------------------------------------------------------');
    lines.push(`Likelihood: ${result.escalation_prediction.likelihood}`);
    lines.push('');
    lines.push('Indicators:');
    result.escalation_prediction.indicators.forEach((i) => lines.push(`  • ${i}`));
    lines.push('');
    lines.push('Recommended Actions:');
    result.escalation_prediction.recommended_actions.forEach((a) => lines.push(`  → ${a}`));
    lines.push('');
  }

  lines.push('----------------------------------------------------------------');
  lines.push('3. RISK REGISTER');
  lines.push('----------------------------------------------------------------');
  result.risks.forEach((r, i) => {
    lines.push(`Risk ${i + 1}: ${r.risk}`);
    lines.push(`  Impact: ${r.impact}  |  Probability: ${r.probability}  |  Status: ${r.status}`);
    lines.push(`  Owner: ${r.owner}`);
    lines.push(`  Mitigation: ${r.mitigation}`);
    lines.push('');
  });

  lines.push('----------------------------------------------------------------');
  lines.push('4. ACTION TRACKER');
  lines.push('----------------------------------------------------------------');
  lines.push(`Total: ${result.action_tracker.total_actions}  |  Open: ${result.action_tracker.open_actions}  |  Overdue: ${result.action_tracker.overdue_actions}`);
  lines.push('');
  result.top_actions.forEach((a, i) => {
    lines.push(`Action ${i + 1}: ${a.action}`);
    lines.push(`  Owner: ${a.owner}  |  Due: ${a.due_date}  |  Status: ${a.status}  |  Priority: ${a.priority}`);
    lines.push('');
  });

  lines.push('----------------------------------------------------------------');
  lines.push('5. SCHEDULE ALERTS');
  lines.push('----------------------------------------------------------------');
  result.schedule_alerts.forEach((s) => {
    lines.push(`Milestone: ${s.milestone}${s.critical_path_flag ? ' [CRITICAL PATH]' : ''}`);
    lines.push(`  Baseline: ${s.baseline_date}  →  Forecast: ${s.forecast_date}  (Variance: +${s.variance_days}d)`);
    lines.push(`  Reason: ${s.reason}`);
    lines.push('');
  });

  if (result.budget_variance) {
    const b = result.budget_variance;
    lines.push('----------------------------------------------------------------');
    lines.push('6. BUDGET VARIANCE');
    lines.push('----------------------------------------------------------------');
    lines.push(`Total Budget:            $${b.total_budget.toLocaleString()}`);
    lines.push(`Actual To Date:          $${b.actual_to_date.toLocaleString()}`);
    lines.push(`Forecast at Completion:  $${b.forecast_at_completion.toLocaleString()}`);
    lines.push(`Variance:                ${b.variance_percent.toFixed(1)}%`);
    lines.push('');
    lines.push('Major Variance Reasons:');
    b.major_variance_reasons.forEach((r) => lines.push(`  • ${r}`));
    lines.push('');
  }

  lines.push('----------------------------------------------------------------');
  lines.push('7. AI CONFIDENCE SCORES');
  lines.push('----------------------------------------------------------------');
  lines.push(`Overall:          ${Math.round(result.confidence_scores.overall * 100)}%`);
  lines.push(`Risk Detection:   ${Math.round(result.confidence_scores.risk_detection * 100)}%`);
  lines.push(`Action Tracking:  ${Math.round(result.confidence_scores.action_tracking * 100)}%`);
  lines.push(`Schedule:         ${Math.round(result.confidence_scores.schedule_analysis * 100)}%`);
  lines.push('');
  lines.push('================================================================');
  lines.push('        Generated by IntellI-PM – Unified SDLC Accelerator');
  lines.push('================================================================');

  return lines.join('\n');
}

function downloadText(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ExportCard({
  icon: Icon,
  title,
  description,
  buttonLabel,
  onClick,
  variant = 'default',
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'warning';
}) {
  const btnClass =
    variant === 'primary'
      ? 'bg-brand-accent text-brand-dark hover:bg-brand-accent/85 font-semibold'
      : variant === 'warning'
      ? 'bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-sm'
      : 'bg-brand-primary/45 hover:bg-brand-primary/55 text-brand-light border border-brand-primary/30 font-medium shadow-sm';

  return (
    <div className="bg-brand-dark/50 rounded-xl border border-brand-primary/30 p-5 shadow-sm flex flex-col gap-3 backdrop-blur-md">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-brand-primary/20">
          <Icon className="w-5 h-5 text-brand-accent" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <p className="text-xs text-brand-light/75 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <button
        onClick={onClick}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent focus-visible:ring-offset-1 focus-visible:ring-offset-brand-dark cursor-pointer ${btnClass}`}
        aria-label={buttonLabel}
      >
        <Download className="w-4 h-4" aria-hidden="true" />
        {buttonLabel}
      </button>
    </div>
  );
}

export default function ExportTab({ result, onRegenerate, isRegenerating }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopyReport = () => {
    const text = exportTextReport(result);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white mb-1">Export & Reports</h2>
        <p className="text-sm text-brand-light/70">
          Download the analysis in various formats or regenerate with a different perspective.
        </p>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ExportCard
          icon={FileText}
          title="Full Report (Text)"
          description="A structured plain-text report covering all analysis sections: summary, risks, actions, schedule, and budget. Suitable for stakeholder distribution."
          buttonLabel="Download Full Report (.txt)"
          onClick={() => downloadText(exportTextReport(result), 'intellipm_report.txt', 'text/plain')}
          variant="primary"
        />
        <ExportCard
          icon={Table2}
          title="Action Tracker (CSV)"
          description="Export the action tracker as a CSV spreadsheet. Includes action description, owner, due date, status, age, and priority."
          buttonLabel="Download Action Tracker (.csv)"
          onClick={() => exportActionsCSV(result)}
        />
        <ExportCard
          icon={Table2}
          title="Risk Register (CSV)"
          description="Export the full risk register as a CSV spreadsheet. Includes risk description, impact, probability, mitigation, owner, and status."
          buttonLabel="Download Risk Register (.csv)"
          onClick={() => exportRisksCSV(result)}
        />
        <ExportCard
          icon={FileText}
          title="Raw Analysis (JSON)"
          description="Export the complete structured JSON output from the IntellI-PM agent. Useful for integration with other tools or systems."
          buttonLabel="Download Analysis (.json)"
          onClick={() => exportFullJSON(result)}
        />
      </div>

      {/* Copy Report to Clipboard */}
      <div className="bg-brand-dark/50 rounded-xl border border-brand-primary/30 p-4 shadow-sm backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Copy Report to Clipboard</p>
            <p className="text-xs text-brand-light/70 mt-0.5">
              Copy the full text report to paste into emails, documents, or other tools.
            </p>
          </div>
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-brand-primary/30 bg-brand-primary/20 hover:bg-brand-primary/35 text-brand-light transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent focus-visible:ring-offset-1 focus-visible:ring-offset-brand-dark cursor-pointer"
            aria-label={copied ? 'Report copied to clipboard' : 'Copy report to clipboard'}
            aria-live="polite"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" aria-hidden="true" />
                Copy to Clipboard
              </>
            )}
          </button>
        </div>
      </div>

      {/* Regenerate */}
      <div className="bg-amber-500/10 rounded-xl border border-amber-500/30 p-4 shadow-sm backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-amber-400">Regenerate Analysis</p>
            <p className="text-xs text-amber-300/80 mt-0.5">
              Re-run the analysis with a different temperature (0.4) for an alternative perspective on the same artifacts.
            </p>
          </div>
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500 focus-visible:ring-offset-1 focus-visible:ring-offset-brand-dark cursor-pointer"
            aria-label={isRegenerating ? 'Regenerating analysis, please wait' : 'Regenerate analysis with alternative perspective'}
            aria-busy={isRegenerating}
          >
            <RefreshCw
              className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            {isRegenerating ? 'Regenerating…' : 'Regenerate Analysis'}
          </button>
        </div>
      </div>

      {/* Source Artifacts Summary */}
      <section aria-labelledby="export-sources-heading" className="bg-brand-dark/50 rounded-xl border border-brand-primary/30 p-4 shadow-sm backdrop-blur-md">
        <h3 id="export-sources-heading" className="text-sm font-bold text-white mb-2">
          Artifacts Included in This Analysis
        </h3>
        <ul className="space-y-1.5" aria-label="Source artifacts list">
          {(result.source_artifacts ?? []).map((a, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-brand-light/95">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" aria-hidden="true" />
              <span className="font-mono">{a}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
