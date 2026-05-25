import { Download, AlertTriangle, CheckCircle, Clock, TrendingDown } from 'lucide-react';
import { mockIntelliPMOutput } from '../../data/mockData';

interface IntelliPMResultsProps {
  onExport: (format: 'pdf' | 'csv' | 'excel') => void;
}

export default function IntelliPMResults({ onExport }: IntelliPMResultsProps) {
  const data = mockIntelliPMOutput;

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Analysis Results</h2>
          <button
            onClick={() => onExport('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
        <p className="text-slate-600">{data.project_health_summary}</p>
      </div>

      {/* Top Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-blue-600" />
          Top Actions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Action</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Owner</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {data.top_actions.map((action, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm text-slate-900">{action.action}</td>
                  <td className="py-3 px-4 text-sm text-slate-700">{action.owner}</td>
                  <td className="py-3 px-4 text-sm text-slate-700">{action.due_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risks */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          Identified Risks
        </h3>
        <div className="space-y-3">
          {data.risks.map((risk, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium text-slate-900">{risk.risk}</p>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  risk.impact === 'high' ? 'bg-red-100 text-red-800' :
                  risk.impact === 'medium' ? 'bg-amber-100 text-amber-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {risk.impact.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-slate-600"><strong>Mitigation:</strong> {risk.mitigation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Tracker */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-600" />
          Action Tracker
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Description</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Age (days)</th>
              </tr>
            </thead>
            <tbody>
              {data.action_tracker.map((action, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm font-mono text-slate-900">{action.id}</td>
                  <td className="py-3 px-4 text-sm text-slate-900">{action.description}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      action.status === 'closed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {action.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-700">{action.age_days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Alerts */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-purple-600" />
          Schedule Alerts
        </h3>
        <div className="space-y-3">
          {data.schedule_alerts.map((alert, idx) => (
            <div key={idx} className="flex items-center justify-between border border-slate-200 rounded-lg p-4">
              <div>
                <p className="text-sm font-medium text-slate-900">{alert.milestone}</p>
                <p className="text-xs text-slate-600">Expected: {alert.expected_date}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                alert.variance_days > 0 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {alert.variance_days > 0 ? '+' : ''}{alert.variance_days} days
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
