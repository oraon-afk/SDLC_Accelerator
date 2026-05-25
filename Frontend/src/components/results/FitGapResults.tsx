import { Download, Target, CheckCircle, Settings, Code, XCircle, Lightbulb } from 'lucide-react';
import { mockFitGapOutput } from '../../data/mockData';

interface FitGapResultsProps {
  onExport: (format: 'pdf' | 'csv' | 'excel') => void;
}

export default function FitGapResults({ onExport }: FitGapResultsProps) {
  const data = mockFitGapOutput;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fit': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'configuration': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'customisation': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'gap': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fit': return <CheckCircle className="w-4 h-4" />;
      case 'configuration': return <Settings className="w-4 h-4" />;
      case 'customisation': return <Code className="w-4 h-4" />;
      case 'gap': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Fit-Gap Analysis Results</h2>
          <button
            onClick={() => onExport('excel')}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Matrix
          </button>
        </div>
      </div>

      {/* Overall Fit Score */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-600" />
          Overall Fit Score
        </h3>
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-700">
                {Math.round(data.overall_fit_score * 100)}%
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-slate-900">{data.customizations_count}</div>
                <div className="text-sm text-slate-600">Customizations Required</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 capitalize">{data.technical_risk}</div>
                <div className="text-sm text-slate-600">Technical Risk</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fit-Gap Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Fit-Gap Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Requirement</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Effort (SP)</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Reason</th>
              </tr>
            </thead>
            <tbody>
              {data.fit_gap_matrix.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm text-slate-900">{item.requirement}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.fit_status)}`}>
                      {getStatusIcon(item.fit_status)}
                      {item.fit_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-slate-900">{item.effort_estimate}</td>
                  <td className="py-3 px-4 text-sm text-slate-700">{item.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Status Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-slate-700">Fit - OOTB</span>
          </div>
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-slate-700">Configuration</span>
          </div>
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-slate-700">Customisation</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-slate-700">Gap</span>
          </div>
        </div>
      </div>

      {/* Architecture Recommendation */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          Architecture Recommendation
        </h3>
        <p className="text-slate-700">{data.architecture_recommendation}</p>
      </div>
    </div>
  );
}
