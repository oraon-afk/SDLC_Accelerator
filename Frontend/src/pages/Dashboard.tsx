import { Persona } from '../types';
import { personaInfo, agents } from '../data/agents';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, Search, Shield, Layers, CheckSquare, 
  FileText, Activity, TrendingUp, LogOut, Upload, ChevronRight, Bell, Zap, Menu, X, AlertTriangle,
  Folder, Plus, Target, Users, DollarSign
} from 'lucide-react';
import { useState, useEffect } from 'react';
import ProjectChatbot from '../components/ProjectChatbot';

interface DashboardProps {
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

export default function Dashboard({ persona, onChangePersona }: DashboardProps) {
  const navigate = useNavigate();
  const info = personaInfo[persona];
  const Icon = personaIcons[persona];
  const availableAgents = agents.filter(agent => agent.persona === persona);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Program Manager project storage (runtime only)
  const [projects, setProjects] = useState<any[]>(() => {
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

  useEffect(() => {
    localStorage.setItem('sdlc_projects', JSON.stringify(projects));
  }, [projects]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  // Form input states (Objective and Budget remain as strings, others become lists/tags)
  const [newProjectName, setNewProjectName] = useState('');
  const [newBusinessGoal, setNewBusinessGoal] = useState('');
  const [newExpectedOutcome, setNewExpectedOutcome] = useState('');
  
  // Lists / tags states
  const [newFeaturesIncluded, setNewFeaturesIncluded] = useState<string[]>([]);
  const [newFeaturesExcluded, setNewFeaturesExcluded] = useState<string[]>([]);
  const [newBusinessOwner, setNewBusinessOwner] = useState<string[]>([]);
  const [newTechnicalOwner, setNewTechnicalOwner] = useState<string[]>([]);
  const [newEndUsers, setNewEndUsers] = useState<string[]>([]);
  
  const [newTeamSize, setNewTeamSize] = useState('');
  const [newCostEstimation, setNewCostEstimation] = useState('');
  const [newToolRequirements, setNewToolRequirements] = useState('');
  
  const [newPerformanceTargets, setNewPerformanceTargets] = useState<string[]>([]);
  const [newUserAdoption, setNewUserAdoption] = useState<string[]>([]);
  const [newTimeReduction, setNewTimeReduction] = useState<string[]>([]);
  const [newErrorReduction, setNewErrorReduction] = useState<string[]>([]);

  // Text inputs for active tag creation editors
  const [featuresIncludedText, setFeaturesIncludedText] = useState('');
  const [featuresExcludedText, setFeaturesExcludedText] = useState('');
  const [businessOwnerText, setBusinessOwnerText] = useState('');
  const [technicalOwnerText, setTechnicalOwnerText] = useState('');
  const [endUsersText, setEndUsersText] = useState('');
  const [performanceTargetsText, setPerformanceTargetsText] = useState('');
  const [userAdoptionText, setUserAdoptionText] = useState('');
  const [timeReductionText, setTimeReductionText] = useState('');
  const [errorReductionText, setErrorReductionText] = useState('');

  // Tag helper functions
  const addTag = (text: string, setText: (val: string) => void, list: string[], setList: (val: string[]) => void) => {
    const trimmed = text.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
      setText('');
    }
  };

  const removeTag = (index: number, list: string[], setList: (val: string[]) => void) => {
    setList(list.filter((_, i) => i !== index));
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProject = {
      id: Date.now().toString(),
      name: newProjectName,
      objective: {
        businessGoal: newBusinessGoal,
        expectedOutcome: newExpectedOutcome,
      },
      scope: {
        featuresIncluded: newFeaturesIncluded,
        featuresExcluded: newFeaturesExcluded,
      },
      stakeholders: {
        businessOwner: newBusinessOwner,
        technicalOwner: newTechnicalOwner,
        endUsers: newEndUsers,
      },
      budgetResources: {
        teamSize: newTeamSize,
        costEstimation: newCostEstimation,
        toolRequirements: newToolRequirements,
      },
      successMetrics: {
        performanceTargets: newPerformanceTargets,
        userAdoption: newUserAdoption,
        timeReduction: newTimeReduction,
        errorReduction: newErrorReduction,
      },
      createdAt: new Date()
    };

    setProjects([newProject, ...projects]);
    setIsCreateModalOpen(false);

    // Reset fields
    setNewProjectName('');
    setNewBusinessGoal('');
    setNewExpectedOutcome('');
    
    setNewFeaturesIncluded([]);
    setNewFeaturesExcluded([]);
    setNewBusinessOwner([]);
    setNewTechnicalOwner([]);
    setNewEndUsers([]);
    
    setNewTeamSize('');
    setNewCostEstimation('');
    setNewToolRequirements('');
    
    setNewPerformanceTargets([]);
    setNewUserAdoption([]);
    setNewTimeReduction([]);
    setNewErrorReduction([]);

    // Reset editor texts
    setFeaturesIncludedText('');
    setFeaturesExcludedText('');
    setBusinessOwnerText('');
    setTechnicalOwnerText('');
    setEndUsersText('');
    setPerformanceTargetsText('');
    setUserAdoptionText('');
    setTimeReductionText('');
    setErrorReductionText('');
  };

  const recentActivity = [
    { id: 1, agent: 'IntellI-PM', action: 'Risk analysis completed', time: '2 hours ago', status: 'success' },
    { id: 2, agent: 'BA Discovery', action: 'User stories generated', time: '5 hours ago', status: 'success' },
    { id: 3, agent: 'Solution Fit-Gap', action: 'Analysis in progress', time: '1 day ago', status: 'pending' },
  ];

  return (
    <div className="min-h-screen bg-brand-dark flex overflow-hidden font-sans">
      
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-brand-dark text-white z-30 transform transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-accent rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">SDLC Accel</span>
              <button className="ml-auto lg:hidden" onClick={() => setIsSidebarOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
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
              {availableAgents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => navigate(`/agent/${agent.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-light/80 rounded-lg hover:bg-brand-primary/20 hover:text-white transition-colors"
                >
                  <Icon className="w-4 h-4 text-brand-light/50" />
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
              onClick={() => onChangePersona(null)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-light/60 rounded-lg hover:bg-brand-primary/20 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Change Role
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Topbar */}
        <header className="bg-brand-dark/95 backdrop-blur-md border-b border-brand-primary/20 sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <button className="lg:hidden p-2 text-brand-light/80 hover:bg-brand-primary/20 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="ml-auto flex items-center gap-4">
              <button className="p-2 text-brand-light/60 hover:text-brand-light transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-accent rounded-full border border-brand-dark"></span>
              </button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent border-2 border-brand-dark shadow-sm"></div>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Welcome Banner */}
          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${info.color} p-8 mb-8 shadow-xl text-white animate-fade-in`}>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl font-bold mb-2 tracking-tight">Welcome back!</h2>
                <p className="text-white/80 text-lg max-w-xl font-light">
                  {info.description}. Ready to accelerate your workflow today?
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                {persona === 'program-manager' && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-brand-accent text-brand-dark border border-transparent px-6 py-2.5 rounded-xl font-bold shadow-sm hover:shadow-brand-accent/40 hover:bg-white transition-all hover:-translate-y-0.5"
                  >
                    + Create Project
                  </button>
                )}
                <button
                  onClick={() => availableAgents[0] && navigate(`/agent/${availableAgents[0].id}`)}
                  className="bg-brand-dark text-brand-light border border-brand-primary/30 px-6 py-2.5 rounded-xl font-semibold shadow-sm hover:shadow-brand-accent/20 hover:border-brand-accent transition-all hover:-translate-y-0.5"
                >
                  Start Analysis
                </button>
                <button
                  onClick={() => navigate('/documents')}
                  className="bg-white/10 backdrop-blur-md text-white border border-white/30 px-6 py-2.5 rounded-xl font-semibold hover:bg-white/20 transition-all hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Upload
                </button>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { label: 'Active Sessions', value: '12', icon: Activity, color: 'text-brand-primary', bg: 'bg-brand-light/50' },
              { label: 'Success Rate', value: '87%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Documents', value: '47', icon: FileText, color: 'text-brand-accent', bg: 'bg-brand-light/50' },
            ].map((stat, i) => (
              <div key={i} className="bg-brand-primary/5 backdrop-blur-md rounded-2xl p-6 border border-brand-primary/30 shadow-sm animate-slide-up" style={{ animationDelay: `${0.1 * (i + 1)}s` }}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-brand-light">{stat.value}</div>
                    <div className="text-sm font-medium text-brand-light/70">{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PM Specific Insights (Only shown for Program Manager) */}
          {persona === 'program-manager' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <div className="bg-brand-dark/50 rounded-2xl p-6 border border-brand-primary/30 shadow-sm backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-brand-accent" />
                    </div>
                    <h3 className="text-lg font-bold text-brand-light">Project Progress</h3>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 bg-brand-primary/30 text-brand-light rounded-lg">Sprint 4</span>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-2 text-brand-light/70">
                    <span>Overall Delivery</span>
                    <span className="font-bold text-brand-light">75%</span>
                  </div>
                  <div className="w-full bg-brand-primary/20 rounded-full h-2.5">
                    <div className="bg-gradient-to-r from-brand-primary to-brand-accent h-2.5 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <p className="text-xs text-brand-light/50">Based on latest JIRA sync (2 hours ago)</p>
              </div>

              <div className="bg-brand-dark/50 rounded-2xl p-6 border border-brand-primary/30 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold text-brand-light">Active Risk Factors</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 p-3 rounded-xl bg-brand-primary/10 border border-brand-primary/20">
                    <span className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(248,113,113,0.6)]"></span>
                    <span className="text-sm text-brand-light/80 leading-snug">Potential schedule slippage due to blocked API integration dependencies.</span>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-xl bg-brand-primary/10 border border-brand-primary/20">
                    <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
                    <span className="text-sm text-brand-light/80 leading-snug">Budget variance of 4% detected in latest vendor invoice processing.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* PM Specific Project Portfolio */}
          {persona === 'program-manager' && (
            <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.18s' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-brand-light flex items-center gap-2">
                  <Folder className="w-5 h-5 text-brand-accent" /> Project Portfolio ({projects.length})
                </h3>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary/20 hover:bg-brand-primary/40 border border-brand-primary/30 rounded-xl text-sm font-semibold text-brand-accent transition-all hover:scale-105"
                >
                  <Plus className="w-4 h-4" /> Create Project
                </button>
              </div>
              
              {projects.length === 0 ? (
                <div className="bg-brand-primary/5 rounded-2xl p-8 border border-brand-primary/30 text-center">
                  <p className="text-brand-light/60 text-sm">No projects created yet. Click "Create Project" to add your first project.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className="group bg-brand-primary/5 backdrop-blur-md rounded-2xl p-6 border border-brand-primary/30 hover:border-brand-accent hover:shadow-lg hover:shadow-brand-accent/10 transition-all text-left cursor-pointer relative"
                    >
                      <div className="absolute top-4 right-4 bg-brand-accent/15 text-brand-accent text-xs font-semibold px-2 py-1 rounded-md">
                        Active
                      </div>
                      <h4 className="text-lg font-bold text-brand-light mb-2 group-hover:text-brand-accent transition-colors truncate pr-12">
                        {project.name}
                      </h4>
                      <p className="text-sm text-brand-light/75 line-clamp-2 leading-relaxed mb-4">
                        {project.objective.businessGoal || 'No business goal specified.'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-brand-light/50 border-t border-brand-primary/20 pt-4">
                        <span>Owner: {project.stakeholders.businessOwner && project.stakeholders.businessOwner[0] ? project.stakeholders.businessOwner[0].split(' ')[0] : 'Unassigned'}</span>
                        <span>Team Size: {project.budgetResources.teamSize || 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Create Project Modal */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-brand-dark border border-brand-primary/40 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 text-white shadow-2xl animate-fade-in flex flex-col">
                <div className="flex items-center justify-between pb-4 border-b border-brand-primary/20 mb-6">
                  <h3 className="text-xl font-bold text-brand-light flex items-center gap-2">
                    <Folder className="w-5 h-5 text-brand-accent" /> Create New Project Profile
                  </h3>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="p-2 text-brand-light/60 hover:text-white hover:bg-brand-primary/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateProject} className="space-y-6">
                  {/* Project Name */}
                  <div>
                    <label className="block text-sm font-semibold text-brand-accent mb-1">Project Name / Title *</label>
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="w-full bg-brand-primary/10 border border-brand-primary/30 rounded-xl px-4 py-2.5 text-white placeholder-brand-light/30 focus:outline-none focus:border-brand-accent text-sm"
                      placeholder="e.g. Next-Generation SDLC Hub"
                      required
                    />
                  </div>

                  {/* 1. Project Objective */}
                  <div className="border-t border-brand-primary/20 pt-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-brand-accent" />
                      1. Project Objective
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-brand-light/70 mb-1">Business Goal</label>
                        <textarea
                          rows={2}
                          value={newBusinessGoal}
                          onChange={(e) => setNewBusinessGoal(e.target.value)}
                          className="w-full bg-brand-primary/10 border border-brand-primary/30 rounded-xl px-4 py-2 text-white placeholder-brand-light/30 focus:outline-none focus:border-brand-accent text-xs"
                          placeholder="What high-level business goal does this address?"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-brand-light/70 mb-1">Expected Outcome</label>
                        <textarea
                          rows={2}
                          value={newExpectedOutcome}
                          onChange={(e) => setNewExpectedOutcome(e.target.value)}
                          className="w-full bg-brand-primary/10 border border-brand-primary/30 rounded-xl px-4 py-2 text-white placeholder-brand-light/30 focus:outline-none focus:border-brand-accent text-xs"
                          placeholder="What is the expected outcome of the project?"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Scope */}
                  <div className="border-t border-brand-primary/20 pt-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-accent" />
                      2. Scope Definition
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Features Included */}
                      <div>
                        <label className="block text-xs text-brand-light/70 mb-1">Features Included (Tags)</label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={featuresIncludedText}
                            onChange={(e) => setFeaturesIncludedText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addTag(featuresIncludedText, setFeaturesIncludedText, newFeaturesIncluded, setNewFeaturesIncluded);
                              }
                            }}
                            className="flex-1 bg-brand-primary/10 border border-brand-primary/30 rounded-xl px-4 py-2 text-white placeholder-brand-light/30 focus:outline-none focus:border-brand-accent text-xs"
                            placeholder="Type feature and press Enter"
                          />
                          <button
                            type="button"
                            onClick={() => addTag(featuresIncludedText, setFeaturesIncludedText, newFeaturesIncluded, setNewFeaturesIncluded)}
                            className="px-3 bg-brand-primary/30 hover:bg-brand-accent hover:text-brand-dark border border-brand-primary/30 rounded-xl text-xs font-bold text-brand-accent transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-brand-primary/5 rounded-xl border border-brand-primary/20">
                          {newFeaturesIncluded.map((tag, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(idx, newFeaturesIncluded, setNewFeaturesIncluded)}
                                className="hover:text-white ml-1 focus:outline-none font-bold"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                          {newFeaturesIncluded.length === 0 && (
                            <span className="text-xs text-brand-light/40 italic">No features added.</span>
                          )}
                        </div>
                      </div>

                      {/* Features Excluded */}
                      <div>
                        <label className="block text-xs text-brand-light/70 mb-1">Features Excluded (Tags)</label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={featuresExcludedText}
                            onChange={(e) => setFeaturesExcludedText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addTag(featuresExcludedText, setFeaturesExcludedText, newFeaturesExcluded, setNewFeaturesExcluded);
                              }
                            }}
                            className="flex-1 bg-brand-primary/10 border border-brand-primary/30 rounded-xl px-4 py-2 text-white placeholder-brand-light/30 focus:outline-none focus:border-brand-accent text-xs"
                            placeholder="Type feature and press Enter"
                          />
                          <button
                            type="button"
                            onClick={() => addTag(featuresExcludedText, setFeaturesExcludedText, newFeaturesExcluded, setNewFeaturesExcluded)}
                            className="px-3 bg-brand-primary/30 hover:bg-brand-accent hover:text-brand-dark border border-brand-primary/30 rounded-xl text-xs font-bold text-brand-accent transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-brand-primary/5 rounded-xl border border-brand-primary/20">
                          {newFeaturesExcluded.map((tag, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(idx, newFeaturesExcluded, setNewFeaturesExcluded)}
                                className="hover:text-white ml-1 focus:outline-none font-bold"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                          {newFeaturesExcluded.length === 0 && (
                            <span className="text-xs text-brand-light/40 italic">No features excluded.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Stakeholders */}
                  <div className="border-t border-brand-primary/20 pt-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-brand-accent" />
                      3. Stakeholders (Tags)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Business Owner */}
                      <div>
                        <label className="block text-xs text-brand-light/70 mb-1">Business Owners</label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={businessOwnerText}
                            onChange={(e) => setBusinessOwnerText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addTag(businessOwnerText, setBusinessOwnerText, newBusinessOwner, setNewBusinessOwner);
                              }
                            }}
                            className="flex-1 bg-brand-primary/10 border border-brand-primary/30 rounded-xl px-4 py-2 text-white placeholder-brand-light/30 focus:outline-none focus:border-brand-accent text-xs"
                            placeholder="Name / Role & Enter"
                          />
                          <button
                            type="button"
                            onClick={() => addTag(businessOwnerText, setBusinessOwnerText, newBusinessOwner, setNewBusinessOwner)}
                            className="px-3 bg-brand-primary/30 hover:bg-brand-accent hover:text-brand-dark border border-brand-primary/30 rounded-xl text-xs font-bold text-brand-accent transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-brand-primary/5 rounded-xl border border-brand-primary/20">
                          {newBusinessOwner.map((tag, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(idx, newBusinessOwner, setNewBusinessOwner)}
                                className="hover:text-white ml-1 focus:outline-none font-bold"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                          {newBusinessOwner.length === 0 && (
                            <span className="text-xs text-brand-light/40 italic">None added.</span>
                          )}
                        </div>
                      </div>

                      {/* Technical Owner */}
                      <div>
                        <label className="block text-xs text-brand-light/70 mb-1">Technical Owners</label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={technicalOwnerText}
                            onChange={(e) => setTechnicalOwnerText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addTag(technicalOwnerText, setTechnicalOwnerText, newTechnicalOwner, setNewTechnicalOwner);
                              }
                            }}
                            className="flex-1 bg-brand-primary/10 border border-brand-primary/30 rounded-xl px-4 py-2 text-white placeholder-brand-light/30 focus:outline-none focus:border-brand-accent text-xs"
                            placeholder="Name / Role & Enter"
                          />
                          <button
                            type="button"
                            onClick={() => addTag(technicalOwnerText, setTechnicalOwnerText, newTechnicalOwner, setNewTechnicalOwner)}
                            className="px-3 bg-brand-primary/30 hover:bg-brand-accent hover:text-brand-dark border border-brand-primary/30 rounded-xl text-xs font-bold text-brand-accent transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-brand-primary/5 rounded-xl border border-brand-primary/20">
                          {newTechnicalOwner.map((tag, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(idx, newTechnicalOwner, setNewTechnicalOwner)}
                                className="hover:text-white ml-1 focus:outline-none font-bold"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                          {newTechnicalOwner.length === 0 && (
                            <span className="text-xs text-brand-light/40 italic">None added.</span>
                          )}
                        </div>
                      </div>

                      {/* End Users */}
                      <div>
                        <label className="block text-xs text-brand-light/70 mb-1">End Users</label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={endUsersText}
                            onChange={(e) => setEndUsersText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addTag(endUsersText, setEndUsersText, newEndUsers, setNewEndUsers);
                              }
                            }}
                            className="flex-1 bg-brand-primary/10 border border-brand-primary/30 rounded-xl px-4 py-2 text-white placeholder-brand-light/30 focus:outline-none focus:border-brand-accent text-xs"
                            placeholder="Audience & Enter"
                          />
                          <button
                            type="button"
                            onClick={() => addTag(endUsersText, setEndUsersText, newEndUsers, setNewEndUsers)}
                            className="px-3 bg-brand-primary/30 hover:bg-brand-accent hover:text-brand-dark border border-brand-primary/30 rounded-xl text-xs font-bold text-brand-accent transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-brand-primary/5 rounded-xl border border-brand-primary/20">
                          {newEndUsers.map((tag, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(idx, newEndUsers, setNewEndUsers)}
                                className="hover:text-white ml-1 focus:outline-none font-bold"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                          {newEndUsers.length === 0 && (
                            <span className="text-xs text-brand-light/40 italic">None added.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Budget & Resources */}
                  <div className="border-t border-brand-primary/20 pt-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-brand-accent" />
                      4. Budget & Resources
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-brand-light/70 mb-1">Team Size</label>
                        <input
                          type="text"
                          value={newTeamSize}
                          onChange={(e) => setNewTeamSize(e.target.value)}
                          className="w-full bg-brand-primary/10 border border-brand-primary/30 rounded-xl px-4 py-2 text-white placeholder-brand-light/30 focus:outline-none focus:border-brand-accent text-xs"
                          placeholder="e.g. 10 members"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-brand-light/70 mb-1">Cost Estimation</label>
                        <input
                          type="text"
                          value={newCostEstimation}
                          onChange={(e) => setNewCostEstimation(e.target.value)}
                          className="w-full bg-brand-primary/10 border border-brand-primary/30 rounded-xl px-4 py-2 text-white placeholder-brand-light/30 focus:outline-none focus:border-brand-accent text-xs"
                          placeholder="e.g. $120,000 USD"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-brand-light/70 mb-1">Tool/Infra Requirements</label>
                        <input
                          type="text"
                          value={newToolRequirements}
                          onChange={(e) => setNewToolRequirements(e.target.value)}
                          className="w-full bg-brand-primary/10 border border-brand-primary/30 rounded-xl px-4 py-2 text-white placeholder-brand-light/30 focus:outline-none focus:border-brand-accent text-xs"
                          placeholder="e.g. AWS, Github, JIRA"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5. Success Metrics / KPIs */}
                  <div className="border-t border-brand-primary/20 pt-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-brand-accent" />
                      5. Success Metrics / KPIs (Tags)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Performance Targets */}
                      <div>
                        <label className="block text-xs text-brand-light/70 mb-1">Performance Targets</label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={performanceTargetsText}
                            onChange={(e) => setPerformanceTargetsText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addTag(performanceTargetsText, setPerformanceTargetsText, newPerformanceTargets, setNewPerformanceTargets);
                              }
                            }}
                            className="flex-1 bg-brand-primary/10 border border-brand-primary/30 rounded-xl px-4 py-2 text-white placeholder-brand-light/30 focus:outline-none focus:border-brand-accent text-xs"
                            placeholder="e.g. Response < 100ms & Enter"
                          />
                          <button
                            type="button"
                            onClick={() => addTag(performanceTargetsText, setPerformanceTargetsText, newPerformanceTargets, setNewPerformanceTargets)}
                            className="px-3 bg-brand-primary/30 hover:bg-brand-accent hover:text-brand-dark border border-brand-primary/30 rounded-xl text-xs font-bold text-brand-accent transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-brand-primary/5 rounded-xl border border-brand-primary/20">
                          {newPerformanceTargets.map((tag, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(idx, newPerformanceTargets, setNewPerformanceTargets)}
                                className="hover:text-white ml-1 focus:outline-none font-bold"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                          {newPerformanceTargets.length === 0 && (
                            <span className="text-xs text-brand-light/40 italic">None added.</span>
                          )}
                        </div>
                      </div>

                      {/* User Adoption */}
                      <div>
                        <label className="block text-xs text-brand-light/70 mb-1">User Adoption Target</label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={userAdoptionText}
                            onChange={(e) => setUserAdoptionText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addTag(userAdoptionText, setUserAdoptionText, newUserAdoption, setNewUserAdoption);
                              }
                            }}
                            className="flex-1 bg-brand-primary/10 border border-brand-primary/30 rounded-xl px-4 py-2 text-white placeholder-brand-light/30 focus:outline-none focus:border-brand-accent text-xs"
                            placeholder="e.g. 90% migration & Enter"
                          />
                          <button
                            type="button"
                            onClick={() => addTag(userAdoptionText, setUserAdoptionText, newUserAdoption, setNewUserAdoption)}
                            className="px-3 bg-brand-primary/30 hover:bg-brand-accent hover:text-brand-dark border border-brand-primary/30 rounded-xl text-xs font-bold text-brand-accent transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-brand-primary/5 rounded-xl border border-brand-primary/20">
                          {newUserAdoption.map((tag, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(idx, newUserAdoption, setNewUserAdoption)}
                                className="hover:text-white ml-1 focus:outline-none font-bold"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                          {newUserAdoption.length === 0 && (
                            <span className="text-xs text-brand-light/40 italic">None added.</span>
                          )}
                        </div>
                      </div>

                      {/* Time/Cost Reduction */}
                      <div>
                        <label className="block text-xs text-brand-light/70 mb-1">Time/Cost Reduction</label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={timeReductionText}
                            onChange={(e) => setTimeReductionText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addTag(timeReductionText, setTimeReductionText, newTimeReduction, setNewTimeReduction);
                              }
                            }}
                            className="flex-1 bg-brand-primary/10 border border-brand-primary/30 rounded-xl px-4 py-2 text-white placeholder-brand-light/30 focus:outline-none focus:border-brand-accent text-xs"
                            placeholder="e.g. 30% savings & Enter"
                          />
                          <button
                            type="button"
                            onClick={() => addTag(timeReductionText, setTimeReductionText, newTimeReduction, setNewTimeReduction)}
                            className="px-3 bg-brand-primary/30 hover:bg-brand-accent hover:text-brand-dark border border-brand-primary/30 rounded-xl text-xs font-bold text-brand-accent transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-brand-primary/5 rounded-xl border border-brand-primary/20">
                          {newTimeReduction.map((tag, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(idx, newTimeReduction, setNewTimeReduction)}
                                className="hover:text-white ml-1 focus:outline-none font-bold"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                          {newTimeReduction.length === 0 && (
                            <span className="text-xs text-brand-light/40 italic">None added.</span>
                          )}
                        </div>
                      </div>

                      {/* Error Reduction */}
                      <div>
                        <label className="block text-xs text-brand-light/70 mb-1">Error Reduction</label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={errorReductionText}
                            onChange={(e) => setErrorReductionText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addTag(errorReductionText, setErrorReductionText, newErrorReduction, setNewErrorReduction);
                              }
                            }}
                            className="flex-1 bg-brand-primary/10 border border-brand-primary/30 rounded-xl px-4 py-2 text-white placeholder-brand-light/30 focus:outline-none focus:border-brand-accent text-xs"
                            placeholder="e.g. 50% fewer bugs & Enter"
                          />
                          <button
                            type="button"
                            onClick={() => addTag(errorReductionText, setErrorReductionText, newErrorReduction, setNewErrorReduction)}
                            className="px-3 bg-brand-primary/30 hover:bg-brand-accent hover:text-brand-dark border border-brand-primary/30 rounded-xl text-xs font-bold text-brand-accent transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-brand-primary/5 rounded-xl border border-brand-primary/20">
                          {newErrorReduction.map((tag, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(idx, newErrorReduction, setNewErrorReduction)}
                                className="hover:text-white ml-1 focus:outline-none font-bold"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                          {newErrorReduction.length === 0 && (
                            <span className="text-xs text-brand-light/40 italic">None added.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end gap-3 border-t border-brand-primary/20 pt-4 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-5 py-2.5 bg-brand-primary/20 hover:bg-brand-primary/40 border border-brand-primary/30 rounded-xl text-sm font-semibold text-brand-light transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-brand-accent text-brand-dark font-bold rounded-xl text-sm hover:bg-white hover:shadow-lg hover:shadow-brand-accent/20 transition-all"
                    >
                      Create Project
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* View Project Details Modal */}
          {selectedProject && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-brand-dark border border-brand-primary/40 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 text-white shadow-2xl animate-fade-in flex flex-col relative">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-4 right-4 p-2 text-brand-light/60 hover:text-white hover:bg-brand-primary/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-6 border-b border-brand-primary/20 pb-4">
                  <span className="text-xs bg-brand-accent/20 text-brand-accent px-2.5 py-1 rounded font-bold uppercase tracking-wider">Project Profile</span>
                  <h3 className="text-2xl font-extrabold text-white mt-2">{selectedProject.name}</h3>
                  <p className="text-xs text-brand-light/50 mt-1">Created on {new Date(selectedProject.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="space-y-6">
                  {/* Objectives */}
                  <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-brand-accent mb-2.5 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      1. Project Objective
                    </h4>
                    <div className="space-y-2 text-sm leading-relaxed">
                      <p><strong className="text-brand-light">Business Goal:</strong> {selectedProject.objective.businessGoal || 'Not specified'}</p>
                      <p><strong className="text-brand-light">Expected Outcome:</strong> {selectedProject.objective.expectedOutcome || 'Not specified'}</p>
                    </div>
                  </div>

                  {/* Scope */}
                  <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-brand-accent mb-2.5 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      2. Scope Definition
                    </h4>
                    <div className="space-y-3 text-sm leading-relaxed">
                      <div>
                        <strong className="text-emerald-400 block mb-1">Included Features:</strong>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {Array.isArray(selectedProject.scope.featuresIncluded) ? (
                            selectedProject.scope.featuresIncluded.map((tag: string, idx: number) => (
                              <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-fade-in">
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-brand-light/60">{selectedProject.scope.featuresIncluded}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <strong className="text-red-400 block mb-1">Excluded Features:</strong>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {Array.isArray(selectedProject.scope.featuresExcluded) ? (
                            selectedProject.scope.featuresExcluded.map((tag: string, idx: number) => (
                              <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-fade-in">
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-brand-light/60">{selectedProject.scope.featuresExcluded}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stakeholders */}
                  <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-brand-accent mb-2.5 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      3. Stakeholder Register
                    </h4>
                    <div className="space-y-3 text-sm leading-relaxed">
                      <div>
                        <strong className="text-brand-light block mb-1">Business Owners:</strong>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {Array.isArray(selectedProject.stakeholders.businessOwner) ? (
                            selectedProject.stakeholders.businessOwner.map((tag: string, idx: number) => (
                              <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-fade-in">
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-brand-light/60">{selectedProject.stakeholders.businessOwner}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <strong className="text-brand-light block mb-1">Technical Owners:</strong>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {Array.isArray(selectedProject.stakeholders.technicalOwner) ? (
                            selectedProject.stakeholders.technicalOwner.map((tag: string, idx: number) => (
                              <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-fade-in">
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-brand-light/60">{selectedProject.stakeholders.technicalOwner}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <strong className="text-brand-light block mb-1">End Users:</strong>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {Array.isArray(selectedProject.stakeholders.endUsers) ? (
                            selectedProject.stakeholders.endUsers.map((tag: string, idx: number) => (
                              <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-fade-in">
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-brand-light/60">{selectedProject.stakeholders.endUsers}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-brand-accent mb-2.5 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      4. Budget & Resource Estimates
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-xs text-brand-light/60 block">Team Size</span>
                        <span className="font-semibold text-brand-light">{selectedProject.budgetResources.teamSize || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-brand-light/60 block">Cost Estimation</span>
                        <span className="font-semibold text-brand-light">{selectedProject.budgetResources.costEstimation || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-brand-light/60 block">Tools & Infrastructure</span>
                        <span className="font-semibold text-brand-light">{selectedProject.budgetResources.toolRequirements || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Success Metrics */}
                  <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-brand-accent mb-2.5 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      5. Success Metrics & KPIs
                    </h4>
                    <div className="space-y-3 text-sm leading-relaxed">
                      <div>
                        <strong className="text-brand-light block mb-1">Performance Targets:</strong>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {Array.isArray(selectedProject.successMetrics.performanceTargets) ? (
                            selectedProject.successMetrics.performanceTargets.map((tag: string, idx: number) => (
                              <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-fade-in">
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-brand-light/60">{selectedProject.successMetrics.performanceTargets}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <strong className="text-brand-light block mb-1">User Adoption Metrics:</strong>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {Array.isArray(selectedProject.successMetrics.userAdoption) ? (
                            selectedProject.successMetrics.userAdoption.map((tag: string, idx: number) => (
                              <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-fade-in">
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-brand-light/60">{selectedProject.successMetrics.userAdoption}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <strong className="text-brand-light block mb-1">Time/Cost Reduction:</strong>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {Array.isArray(selectedProject.successMetrics.timeReduction) ? (
                            selectedProject.successMetrics.timeReduction.map((tag: string, idx: number) => (
                              <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-fade-in">
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-brand-light/60">{selectedProject.successMetrics.timeReduction}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <strong className="text-brand-light block mb-1">Error / Defect Reduction:</strong>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {Array.isArray(selectedProject.successMetrics.errorReduction) ? (
                            selectedProject.successMetrics.errorReduction.map((tag: string, idx: number) => (
                              <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-fade-in">
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-brand-light/60">{selectedProject.successMetrics.errorReduction}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6 border-t border-brand-primary/20 pt-4">
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="px-6 py-2.5 bg-brand-accent text-brand-dark font-bold rounded-xl text-sm hover:bg-white transition-colors"
                  >
                    Close Profile
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Quick Launch */}
            <div className="xl:col-span-2">
              <h3 className="text-lg font-bold text-brand-light mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-brand-accent" /> Quick Launch
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {availableAgents.map((agent, i) => (
                  <button
                    key={agent.id}
                    onClick={() => navigate(`/agent/${agent.id}`)}
                    className="group bg-brand-primary/5 backdrop-blur-md rounded-2xl p-6 border border-brand-primary/30 hover:border-brand-accent hover:shadow-lg hover:shadow-brand-accent/10 transition-all text-left animate-slide-up"
                    style={{ animationDelay: `${0.2 + (i * 0.1)}s` }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${info.color} flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5 text-brand-dark" />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center group-hover:bg-brand-accent/20 transition-colors">
                        <ChevronRight className="w-4 h-4 text-brand-light/50 group-hover:text-brand-accent" />
                      </div>
                    </div>
                    <h4 className="text-base font-bold text-brand-light mb-1">{agent.name}</h4>
                    <p className="text-sm text-brand-light/60 line-clamp-2 leading-relaxed">{agent.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-lg font-bold text-brand-light mb-4">Recent Activity</h3>
              <div className="bg-brand-primary/5 backdrop-blur-md rounded-2xl border border-brand-primary/30 p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="space-y-6">
                  {recentActivity.map((activity, i) => (
                    <div key={activity.id} className="relative pl-6">
                      {/* Timeline line */}
                      {i !== recentActivity.length - 1 && (
                        <div className="absolute left-2 top-6 bottom-[-24px] w-0.5 bg-brand-primary/30"></div>
                      )}
                      {/* Timeline dot */}
                      <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-brand-dark shadow-sm ${
                        activity.status === 'success' ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}></div>
                      
                      <div>
                        <p className="text-sm font-bold text-brand-light">{activity.agent}</p>
                        <p className="text-sm text-brand-light/70 mt-0.5">{activity.action}</p>
                        <p className="text-xs text-brand-light/50 mt-1 font-medium">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-6 py-2 text-sm font-medium text-brand-accent bg-brand-primary/20 hover:bg-brand-primary/40 rounded-lg transition-colors">
                  View All Activity
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ProjectChatbot />
    </div>
  );
}
