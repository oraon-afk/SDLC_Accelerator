import { Download, CheckCircle, FileCheck, Link, TestTube } from 'lucide-react';
import { mockTraceabilityOutput } from '../../data/mockData';

interface TraceabilityResultsProps {
  onExport: (format: 'pdf' | 'csv' | 'excel') => void;
}

export default function TraceabilityResults({ onExport }: TraceabilityResultsProps) {
  const data = mockTraceabilityOutput;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Validation & Traceability Results</h2>
          <div className="flex gap-2">
            <button
              onClick={() => onExport('excel')}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Matrix
            </button>
            <button
              onClick={() => onExport('csv')}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Tests
            </button>
          </div>
        </div>
      </div>

      {/* Coverage Score */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-rose-600" />
          Test Coverage Score
        </h3>
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-rose-700">
                {Math.round(data.coverage_score * 100)}%
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Requirements Coverage</span>
                <span className="font-semibold text-slate-900">{Math.round(data.coverage_score * 100)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-rose-600"
                  style={{ width: `${data.coverage_score * 100}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-4">
              {data.test_scenarios.length} test scenarios generated covering {data.traceability_matrix.length} requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Test Scenarios */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TestTube className="w-5 h-5 text-blue-600" />
          Generated Test Scenarios
        </h3>
        <div className="space-y-4">
          {data.test_scenarios.map((scenario, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono font-semibold">
                    {scenario.id}
                  </span>
                  <span className="text-xs text-slate-500">→</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-mono font-semibold">
                    {scenario.requirement_id}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-semibold text-slate-700">STEPS:</span>
                  <ol className="list-decimal list-inside text-sm text-slate-700 mt-1 space-y-1">
                    {scenario.steps.map((step, stepIdx) => (
                      <li key={stepIdx}>{step}</li>
                    ))}
                  </ol>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-700">EXPECTED:</span>
                  <p className="text-sm text-slate-700 mt-1">{scenario.expected}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Traceability Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Link className="w-5 h-5 text-purple-600" />
          Traceability Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Requirement ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Linked Test Cases</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {data.traceability_matrix.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-mono font-semibold">
                      {item.requirement_id}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 flex-wrap">
                      {item.test_ids.map((testId, testIdx) => (
                        <span key={testIdx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono">
                          {testId}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Acceptance Criteria */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-emerald-600" />
          Acceptance Criteria (Gherkin)
        </h3>
        <div className="space-y-3">
          {data.acceptance_criteria.map((criteria, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-sm">
              {criteria.split(', ').map((part, partIdx) => {
                const trimmed = part.trim();
                let keyword = '';
                let text = trimmed;
                
                if (trimmed.startsWith('Given')) {
                  keyword = 'Given';
                  text = trimmed.substring(5).trim();
                } else if (trimmed.startsWith('When')) {
                  keyword = 'When';
                  text = trimmed.substring(4).trim();
                } else if (trimmed.startsWith('Then')) {
                  keyword = 'Then';
                  text = trimmed.substring(4).trim();
                }

                return (
                  <div key={partIdx}>
                    {keyword && <span className="font-bold text-emerald-700">{keyword}</span>} {text}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
