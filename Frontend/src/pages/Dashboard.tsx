import { Persona } from '../types';
import { personaInfo, agents } from '../data/agents';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, Search, Shield, Layers, CheckSquare, 
  FileText, Activity, TrendingUp, LogOut, Upload, ChevronRight, Bell, Zap, Menu, X, AlertTriangle
} from 'lucide-react';
import { useState } from 'react';
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
