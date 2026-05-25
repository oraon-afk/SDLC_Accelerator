import { Download, Shield, CheckCircle, XCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { mockBAProcessOutput } from '../../data/mockData';

interface BAProcessResultsProps {
  onExport: (format: 'pdf' | 'csv' | 'excel') => void;
}

export default function BAProcessResults({ onExport }: BAProcessResultsProps) {
  const data = mockBAProcessOutput;

  const getRiskColor = (score: number) => {
    if (score < 40) return 'text-emerald-600';
    if (score < 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const getRiskBg = (score: number) => {
    if (score < 40) return 'bg-emerald-100';
    if (score < 70) return 'bg-amber-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Process Intelligence Results</h2>
          <button
            onClick={() => onExport('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Audit Report
          </button>
        </div>
      </div>

      {/* Risk Score */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600" />
          Overall Risk Score
        </h3>
        <div className="flex items-center gap-6">
          <div className={`w-32 h-32 rounded-full ${getRiskBg(data.risk_score)} flex items-center justify-center`}>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getRiskColor(data.risk_score)}`}>
                {data.risk_score}
              </div>
              <div className="text-sm text-slate-600">/ 100</div>
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Risk Level</span>
                <span className={`font-semibold ${getRiskColor(data.risk_score)}`}>
                  {data.risk_score < 40 ? 'Low' : data.risk_score < 70 ? 'Medium' : 'High'}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    data.risk_score < 40 ? 'bg-emerald-600' : 
                    data.risk_score < 70 ? 'bg-amber-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${data.risk_score}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-4">
              Based on compliance framework analysis across GDPR, HIPAA, SOC2, and industry benchmarks.
            </p>
          </div>
        </div>
      </div>

      {/* Compliance Checks */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Compliance Framework Checks</h3>
        <div className="space-y-3">
          {data.compliance_checks.map((check, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {check.status === 'pass' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                  {check.status === 'fail' && <XCircle className="w-5 h-5 text-red-600" />}
                  {check.status === 'partial' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                  <span className="font-mono text-sm font-semibold text-slate-900">{check.rule_id}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  check.status === 'pass' ? 'bg-emerald-100 text-emerald-800' :
                  check.status === 'fail' ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {check.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-slate-600">{check.evidence}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Process Gaps */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          Process Gaps
        </h3>
        <ul className="space-y-2">
          {data.process_gaps.map((gap, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <span className="text-amber-600 mt-0.5">•</span>
              {gap}
            </li>
          ))}
        </ul>
      </div>

      {/* Benchmark Comparison */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Benchmark Comparison
        </h3>
        <p className="text-slate-700">{data.benchmark_comparisons}</p>
      </div>
    </div>
  );
}
