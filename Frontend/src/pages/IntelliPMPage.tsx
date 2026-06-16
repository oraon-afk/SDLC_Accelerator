import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AnalysisResult, AnalysisModules, PriorityLevel, TimeHorizon, UploadedFile } from '../types/intellipm';
import type { Persona } from '../types';
import { personaInfo, agents } from '../data/agents';
import IntelliPMWorkspace from '../components/intellipm/IntelliPMWorkspace';
import ResultsDashboard from '../components/intellipm/ResultsDashboard';
import ProjectDocumentsPanel from '../components/intellipm/ProjectDocumentsPanel';
import { emptyAnalysisResult } from '../data/mockAnalysisResult';
import { Brain, Zap, Home, LogOut, Menu, X, Bell, ClipboardList, Search, Shield, Layers, CheckSquare, FileText } from 'lucide-react';

interface IntelliPMPageProps {
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

type AppState = 'workspace' | 'processing' | 'results';

const PROCESSING_STEPS = [
  'Parsing uploaded artifacts…',
  'Running OCR on images…',
  'Extracting text from documents…',
  'Fusing context from all sources…',
  'Detecting risks and actions…',
  'Analysing schedule deviations…',
  'Predicting escalation likelihood…',
  'Validating JSON output…',
  'Generating confidence scores…',
  'Finalising health report…',
];

export default function IntelliPMPage({ persona, onChangePersona }: IntelliPMPageProps) {
  const navigate = useNavigate();
  const info = personaInfo[persona];
  const Icon = personaIcons[persona];
  const availableAgents = agents.filter(agent => agent.persona === persona);

  const [appState, setAppState] = useState<AppState>('workspace');
  const [processingStep, setProcessingStep] = useState(PROCESSING_STEPS[0]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [hasIndexedFiles, setHasIndexedFiles] = useState(false);

  // Load projects from localStorage (Runtime only)
  const [projects] = useState<any[]>(() => {
    const saved = localStorage.getItem('sdlc_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Dynamic data migration to automatically overwrite legacy E-Commerce details in user's browser storage
          return parsed.map(p => {
            if (p.id === '1' && (p.name === 'E-Commerce Platform Modernization' || p.objective?.businessGoal?.includes('conversion'))) {
              return {
                id: '1',
                name: 'PLM Program',
                objective: {
                  businessGoal: 'Consolidate global legacy PLM program streams into a unified high-performance platform.',
                  expectedOutcome: 'Reduced pipeline cycle variance, consolidated licensing costs, and streamlined automotive component engineering compliance.'
                },
                scope: {
                  featuresIncluded: ['APQP integration', 'CAD asset migrations', 'Change management workflows', 'ASPICE compliance tooling'],
                  featuresExcluded: ['Legacy system hotfixes', 'On-prem infrastructure hosting', 'Manual CAD conversions']
                },
                stakeholders: {
                  businessOwner: ['Sarah Jenkins (Customer PM)', 'Global Delivery President'],
                  technicalOwner: ['David Chen (Tech Arch)', 'QA Lead', 'DevOps Lead'],
                  endUsers: ['Automotive engineers', 'Component compliance designers', 'QA testers']
                },
                budgetResources: {
                  teamSize: '45 members globally',
                  costEstimation: '$2,500,000 USD',
                  toolRequirements: 'Windchill, Siemens Teamcenter, AWS Cloud, Ollama'
                },
                successMetrics: {
                  performanceTargets: ['99% platform availability', 'Migration throughput > 500 components/day'],
                  userAdoption: ['80% user transition in 60 days', 'CSAT score > 4.6/5'],
                  timeReduction: ['Engineering compliance approvals reduced by 30%', 'UAT schedule variance < 5 days'],
                  errorReduction: ['40% fewer migration validation errors', 'Zero security audit compliance failures']
                },
                createdAt: p.createdAt || new Date('2026-05-10')
              };
            }
            return p;
          });
        }
      } catch (e) {
        console.error('Error parsing saved projects', e);
      }
    }
    // Default seed project
    return [
      {
        id: '1',
        name: 'PLM Program',
        objective: {
          businessGoal: 'Consolidate global legacy PLM program streams into a unified high-performance platform.',
          expectedOutcome: 'Reduced pipeline cycle variance, consolidated licensing costs, and streamlined automotive component engineering compliance.'
        },
        scope: {
          featuresIncluded: ['APQP integration', 'CAD asset migrations', 'Change management workflows', 'ASPICE compliance tooling'],
          featuresExcluded: ['Legacy system hotfixes', 'On-prem infrastructure hosting', 'Manual CAD conversions']
        },
        stakeholders: {
          businessOwner: ['Sarah Jenkins (Customer PM)', 'Global Delivery President'],
          technicalOwner: ['David Chen (Tech Arch)', 'QA Lead', 'DevOps Lead'],
          endUsers: ['Automotive engineers', 'Component compliance designers', 'QA testers']
        },
        budgetResources: {
          teamSize: '45 members globally',
          costEstimation: '$2,500,000 USD',
          toolRequirements: 'Windchill, Siemens Teamcenter, AWS Cloud, Ollama'
        },
        successMetrics: {
          performanceTargets: ['99% platform availability', 'Migration throughput > 500 components/day'],
          userAdoption: ['80% user transition in 60 days', 'CSAT score > 4.6/5'],
          timeReduction: ['Engineering compliance approvals reduced by 30%', 'UAT schedule variance < 5 days'],
          errorReduction: ['40% fewer migration validation errors', 'Zero security audit compliance failures']
        },
        createdAt: new Date('2026-05-10')
      }
    ];
  });

  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const projectName = selectedProject ? selectedProject.name : '';

  const handleAnalysisStart = useCallback(
    async (config: {
      modules: AnalysisModules;
      priority: PriorityLevel;
      timeHorizon: TimeHorizon;
      files: UploadedFile[];
      notes: string;
    }) => {
      // Find the details of the currently selected project
      const selectedProject = projects.find((p) => p.id === selectedProjectId);

      // Build the unified backend JSON analysis payload
      const payload = {
        project_id: selectedProjectId,
        project_name: selectedProject ? selectedProject.name : 'Unknown',
        project_details: selectedProject ? {
          objective: selectedProject.objective,
          scope: selectedProject.scope,
          stakeholders: selectedProject.stakeholders,
          budgetResources: selectedProject.budgetResources,
          successMetrics: selectedProject.successMetrics
        } : null,
        analysis_config: {
          modules: config.modules,
          priority: config.priority,
          timeHorizon: config.timeHorizon,
          notes: config.notes
        },
        uploaded_files: config.files.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type
        }))
      };

      setLastPayload(payload);

      console.log('--- CONSTRUCTED LIVE ANALYSIS JSON PAYLOAD ---');
      console.log(JSON.stringify(payload, null, 2));
      console.log('----------------------------------------------');

      setAppState('processing');
      setProcessingStep(PROCESSING_STEPS[0]);

      try {
        // Start backend uvicorn analysis query
        const apiPromise = fetch('http://localhost:8000/api/analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }).then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        });

        // Run through steps concurrently for premium, smooth UI progression
        for (let i = 0; i < PROCESSING_STEPS.length; i++) {
          setProcessingStep(PROCESSING_STEPS[i]);
          await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
        }

        // Wait for the backend response to complete
        const liveResult = await apiPromise;
        setResult(liveResult);
        setAppState('results');
      } catch (err: any) {
        console.warn('Backend live analysis offline or failed:', err);
        // Return NA-valued skeleton — no static fabricated data
        setResult({
          ...emptyAnalysisResult,
          analysis_timestamp: new Date().toISOString(),
          project_health_summary: {
            ...emptyAnalysisResult.project_health_summary,
            narrative: `Backend AI service is not reachable (${err.message || err}). No analysis data available. Please ensure the Ollama server is running at http://localhost:8000 and try again.`,
          },
        });
        setAppState('results');
      }
    },
    [projects, selectedProjectId]
  );

  const handleBack = () => {
    setAppState('workspace');
    setResult(null);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      if (!lastPayload) throw new Error("No previous analysis payload found");

      const res = await fetch('http://localhost:8000/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lastPayload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.warn('Backend live analysis regeneration offline/failed:', err);
      // Wait slightly for organic UI flow
      await new Promise((r) => setTimeout(r, 1500));
      setResult({
        ...emptyAnalysisResult,
        analysis_timestamp: new Date().toISOString(),
        project_health_summary: {
          ...emptyAnalysisResult.project_health_summary,
          narrative:
            'Regeneration failed — backend AI service is not reachable. No analysis data available. Please check the server connection and try again.',
        },
      });
    }
    setIsRegenerating(false);
  };

  const handleLogout = () => {
    onChangePersona(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-brand-dark flex overflow-hidden font-sans">

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar (Identical to Dashboard) */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-brand-dark border-r border-brand-primary/20 text-white z-30 transform transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-accent rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-brand-light">SDLC Accel</span>
              <button className="ml-auto lg:hidden" onClick={() => setIsSidebarOpen(false)}>
                <X className="w-5 h-5 text-brand-light/50" />
              </button>
            </div>

            <div className="px-4 py-3 bg-brand-primary/10 rounded-xl border border-brand-primary/20 mb-8 backdrop-blur-sm">
              <div className="text-xs text-brand-light/60 uppercase tracking-wider mb-1 font-semibold">Active Role</div>
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Icon className="w-4 h-4 text-brand-accent" />
                <span className="truncate">{info.title}</span>
              </div>
            </div>

            <nav className="space-y-1.5">
              <div className="text-xs font-semibold text-brand-light/50 uppercase tracking-wider mb-3 px-3">Agents</div>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-light/80 rounded-lg hover:bg-brand-primary/20 hover:text-white transition-colors"
              >
                <Home className="w-4 h-4 text-brand-light/50" />
                <span className="truncate">Dashboard</span>
              </button>
              {availableAgents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => navigate(`/agent/${agent.id}`)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${agent.id === 'intelli-pm' ? 'bg-brand-primary/30 text-white' : 'text-brand-light/80 hover:bg-brand-primary/20 hover:text-white'}`}
                >
                  <Icon className={`w-4 h-4 ${agent.id === 'intelli-pm' ? 'text-brand-accent' : 'text-brand-light/50'}`} />
                  <span className="truncate">{agent.name}</span>
                </button>
              ))}

              <div className="text-xs font-semibold text-brand-light/50 uppercase tracking-wider mt-8 mb-3 px-3">Resources</div>
              <button
                onClick={() => navigate('/documents')}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-light/80 rounded-lg hover:bg-brand-primary/20 hover:text-white transition-colors"
              >
                <FileText className="w-4 h-4 text-brand-light/50" />
                Documents
              </button>
            </nav>
          </div>

          <div className="p-4 mt-auto border-t border-brand-primary/20">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-light/60 rounded-lg hover:bg-brand-primary/20 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Change Role
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-brand-dark">
        {/* Topbar */}
        <header className="bg-brand-dark/95 backdrop-blur-md border-b border-brand-primary/20 sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <button className="lg:hidden p-2 text-brand-light/80 hover:bg-brand-primary/20 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>

            <div className="ml-auto flex items-center gap-4">
              {/* Powered by badge */}
              <div
                className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-brand-primary/20 border border-brand-accent/30 rounded-full"
                aria-label="Powered by GPT-4o and Claude 3.5"
              >
                <Zap className="w-3 h-3 text-brand-accent" aria-hidden="true" />
                <span className="text-xs font-medium text-brand-light">Local LLM Model</span>
              </div>
              <button className="p-2 text-brand-light/60 hover:text-white transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-accent rounded-full border border-brand-dark"></span>
              </button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent border-2 border-brand-dark shadow-sm"></div>
            </div>
          </div>
        </header>

        {/* Breadcrumb / Process Stepper */}
        <div className="bg-brand-dark border-b border-brand-primary/20" aria-label="Process steps">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2">
            <ol
              className="flex items-center gap-1 text-xs text-slate-500"
              aria-label="Current step in analysis process"
            >
              {[
                { label: 'Workspace', step: 'workspace' },
                { label: 'Processing', step: 'processing' },
                { label: 'Results', step: 'results' },
              ].map(({ label, step }, i, arr) => {
                const isActive = appState === step;
                const isPast =
                  (step === 'workspace' && (appState === 'processing' || appState === 'results')) ||
                  (step === 'processing' && appState === 'results');

                return (
                  <li key={step} className="flex items-center gap-1">
                    <span
                      className={`flex items-center gap-1 font-medium ${isActive
                          ? 'text-brand-accent'
                          : isPast
                            ? 'text-brand-light/80'
                            : 'text-brand-light/40'
                        }`}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      <span
                        className={`inline-flex w-5 h-5 rounded-full text-xs items-center justify-center font-bold flex-shrink-0 ${isActive
                            ? 'bg-brand-accent text-brand-dark'
                            : isPast
                              ? 'bg-brand-primary text-brand-light'
                              : 'bg-brand-dark border border-brand-primary/50 text-brand-light/40'
                          }`}
                        aria-hidden="true"
                      >
                        {isPast ? '✓' : i + 1}
                      </span>
                      {label}
                    </span>
                    {i < arr.length - 1 && (
                      <span className="text-brand-primary/50 mx-0.5" aria-hidden="true">›</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* Main Content Area Workspace */}
        <div id="main-content" className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <div className="max-w-5xl mx-auto">
            {/* Page Title for the current state */}
            {appState === 'workspace' && (
              <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Brain className="w-7 h-7 text-brand-accent" /> Project Health Intelligence
                  </h2>
                  <p className="text-brand-light/60 mt-2 text-sm">
                    Upload your project artifacts and configure the analysis to generate a comprehensive health report.
                  </p>
                </div>

                {/* Project Selection Dropdown */}
                <div className="shrink-0 flex items-center gap-2 bg-brand-primary/10 border border-brand-primary/30 rounded-xl px-3 py-2 backdrop-blur-sm">
                  <label htmlFor="project-select" className="text-xs font-bold text-brand-accent uppercase tracking-wider">Select Project:</label>
                  <select
                    id="project-select"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="bg-brand-dark/80 text-white text-sm font-medium border border-brand-primary/30 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-accent cursor-pointer max-w-[240px] focus:ring-1 focus:ring-brand-accent"
                  >
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id} className="bg-brand-dark text-white">
                        {proj.name}
                      </option>
                    ))}
                    {projects.length === 0 && (
                      <option value="" className="bg-brand-dark text-white">No projects available</option>
                    )}
                  </select>
                </div>
              </div>
            )}

            {appState === 'results' && result && (
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <CheckSquare className="w-7 h-7 text-brand-accent" /> Analysis Results
                </h2>
                <p className="text-brand-light/60 mt-2 text-sm">
                  Review the structured health intelligence report below. You can edit fields inline before exporting.
                </p>
              </div>
            )}

            {/* Content Card */}
            <div>
              {appState === 'workspace' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Workspace Form */}
                  <div className="lg:col-span-2 bg-brand-primary/5 border border-brand-primary/30 rounded-2xl shadow-xl p-5 sm:p-6 lg:p-8 backdrop-blur-md">
                    <IntelliPMWorkspace
                      onAnalysisStart={handleAnalysisStart}
                      isProcessing={false}
                      processingStep={processingStep}
                      hasIndexedFiles={hasIndexedFiles}
                    />
                  </div>

                  {/* Right Column: Project Documents Panel */}
                  <div className="bg-brand-primary/5 border border-brand-primary/30 rounded-2xl shadow-xl p-5 sm:p-6 backdrop-blur-md flex flex-col">
                    <ProjectDocumentsPanel 
                      projectName={projectName} 
                      onFilesChange={(files) => setHasIndexedFiles(files.length > 0)}
                    />
                  </div>
                </div>
              )}

              {appState === 'processing' && (
                <div className="bg-brand-primary/5 border border-brand-primary/30 rounded-2xl shadow-xl p-5 sm:p-6 lg:p-8 backdrop-blur-md">
                  <IntelliPMWorkspace
                    onAnalysisStart={handleAnalysisStart}
                    isProcessing={true}
                    processingStep={processingStep}
                  />
                </div>
              )}

              {appState === 'results' && result && (
                <div className="bg-brand-primary/5 border border-brand-primary/30 rounded-2xl shadow-xl p-5 sm:p-6 lg:p-8 backdrop-blur-md">
                  <ResultsDashboard
                    result={result}
                    onBack={handleBack}
                    onRegenerate={handleRegenerate}
                    isRegenerating={isRegenerating}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
