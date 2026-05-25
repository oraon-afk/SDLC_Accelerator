import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Persona } from '../types';
import { agents, personaInfo } from '../data/agents';
import { 
  Upload, FileText, Settings, Play, 
  Home, LogOut, Loader, CheckCircle, XCircle,
  ClipboardList, Search, Shield, Layers, CheckSquare
} from 'lucide-react';
import IntelliPMResults from '../components/results/IntelliPMResults';
import BADiscoveryResults from '../components/results/BADiscoveryResults';
import BAProcessResults from '../components/results/BAProcessResults';
import FitGapResults from '../components/results/FitGapResults';
import TraceabilityResults from '../components/results/TraceabilityResults';

interface AgentWorkspaceProps {
  persona: Persona;
  onChangePersona: (persona: Persona | null) => void;
}

const personaIcons = {
  'program-manager': ClipboardList,
  'ba-discovery': Search,
  'ba-process-intelligence': Shield,
  'solution-architect': Layers,
  'validation-lead': CheckSquare,
};

type AnalysisStatus = 'idle' | 'uploading' | 'analyzing' | 'completed' | 'error';

export default function AgentWorkspace({ persona, onChangePersona }: AgentWorkspaceProps) {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showResults, setShowResults] = useState(false);

  const agent = agents.find(a => a.id === agentId);
  const info = personaInfo[persona];
  const Icon = personaIcons[persona];

  if (!agent) {
    return <div>Agent not found</div>;
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles([...uploadedFiles, ...Array.from(e.target.files)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleRunAnalysis = () => {
    setStatus('analyzing');
    // Simulate analysis
    setTimeout(() => {
      setStatus('completed');
      setShowResults(true);
    }, 2000);
  };

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    console.log(`Exporting as ${format}`);
    // In real app, this would trigger export
  };

  const renderResults = () => {
    switch (agentId) {
      case 'intelli-pm':
        return <IntelliPMResults onExport={handleExport} />;
      case 'ba-discovery':
        return <BADiscoveryResults onExport={handleExport} />;
      case 'ba-process-intelligence':
        return <BAProcessResults onExport={handleExport} />;
      case 'solution-fit-gap':
        return <FitGapResults onExport={handleExport} />;
      case 'validation-traceability':
        return <TraceabilityResults onExport={handleExport} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 bg-gradient-to-br ${info.color} rounded-lg flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{agent.name}</h1>
                <p className="text-sm text-slate-600">{info.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => {
                  onChangePersona(null);
                  navigate('/');
                }}
                className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Upload & Config */}
          <div className="space-y-6">
            {/* Upload Zone */}
            <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Upload Documents</h3>
              <label className="block">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.docx,.txt,.csv,.xlsx"
                />
                <div className="flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600 text-center">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    PDF, DOCX, TXT, CSV, XLSX
                  </p>
                </div>
              </label>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-900 truncate">{file.name}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="text-slate-400 hover:text-red-600 ml-2"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Configuration */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-slate-700" />
                <h3 className="text-sm font-semibold text-slate-900">Configuration</h3>
              </div>
              
              {agentId === 'intelli-pm' && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-slate-700">Risk Detection</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-slate-700">Action Tracking</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-slate-700">Schedule Analysis</span>
                  </label>
                  <div className="pt-2">
                    <label className="text-sm text-slate-700 block mb-2">Priority Level</label>
                    <select className="w-full rounded-lg border-slate-300 text-sm">
                      <option>Low</option>
                      <option selected>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                </div>
              )}

              {agentId === 'ba-process-intelligence' && (
                <div className="space-y-3">
                  <label className="text-sm text-slate-700 block mb-2">Compliance Frameworks</label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-slate-700">GDPR</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-slate-700">HIPAA</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-slate-700">SOC2</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-slate-700">ISO 27001</span>
                  </label>
                  <div className="pt-2">
                    <label className="text-sm text-slate-700 block mb-2">Industry</label>
                    <select className="w-full rounded-lg border-slate-300 text-sm">
                      <option>Healthcare</option>
                      <option>Finance</option>
                      <option>Manufacturing</option>
                      <option selected>Technology</option>
                    </select>
                  </div>
                </div>
              )}

              {!['intelli-pm', 'ba-process-intelligence'].includes(agentId || '') && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-slate-700">Enable advanced analysis</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-slate-700">Include examples</span>
                  </label>
                </div>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={handleRunAnalysis}
              disabled={uploadedFiles.length === 0 || status === 'analyzing'}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                uploadedFiles.length === 0 || status === 'analyzing'
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {status === 'analyzing' ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Run Analysis</span>
                </>
              )}
            </button>

            {/* Status */}
            {status === 'completed' && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-emerald-900 font-medium">Analysis completed successfully</span>
              </div>
            )}
          </div>

          {/* Main Area - Results */}
          <div className="lg:col-span-2">
            {!showResults ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${info.color} rounded-2xl mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{agent.name}</h3>
                <p className="text-slate-600 max-w-md mx-auto mb-6">{agent.description}</p>
                <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                  <Upload className="w-4 h-4" />
                  <span>Upload documents and run analysis to see results</span>
                </div>
              </div>
            ) : (
              renderResults()
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
