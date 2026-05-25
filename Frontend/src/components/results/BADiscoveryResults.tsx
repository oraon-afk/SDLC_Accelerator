import { Download, Users, FileText, AlertCircle, MessageCircle, Lightbulb } from 'lucide-react';
import { mockBADiscoveryOutput } from '../../data/mockData';

interface BADiscoveryResultsProps {
  onExport: (format: 'pdf' | 'csv' | 'excel') => void;
}

export default function BADiscoveryResults({ onExport }: BADiscoveryResultsProps) {
  const data = mockBADiscoveryOutput;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Discovery Analysis Results</h2>
          <button
            onClick={() => onExport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Meeting Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-emerald-600" />
          Meeting Summary
        </h3>
        <p className="text-slate-700">{data.meeting_summary}</p>
      </div>

      {/* User Stories */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          User Stories
        </h3>
        <div className="space-y-3">
          {data.user_stories.map((story, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <p className="text-sm text-slate-900">
                <span className="font-semibold text-blue-700">As a</span> {story.as_a},{' '}
                <span className="font-semibold text-blue-700">I want</span> {story.i_want},{' '}
                <span className="font-semibold text-blue-700">so that</span> {story.so_that}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          Requirements
        </h3>
        <div className="space-y-2">
          {data.requirements.map((req, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg">
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-mono font-semibold">
                {req.id}
              </span>
              <p className="text-sm text-slate-900 flex-1">{req.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pain Points */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          Pain Points
        </h3>
        <ul className="space-y-2">
          {data.pain_points.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-red-600 mt-1">•</span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      {/* Gaps */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          Identified Gaps
        </h3>
        <div className="space-y-3">
          {data.gaps.map((item, idx) => (
            <div key={idx} className="border border-amber-200 bg-amber-50 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-900 mb-1">{item.gap}</p>
              <p className="text-sm text-slate-700"><strong>Impact:</strong> {item.impact}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Follow-up Questions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          Follow-up Questions
        </h3>
        <ul className="space-y-2">
          {data.follow_up_questions.map((question, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-yellow-600 font-bold">?</span>
              {question}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
