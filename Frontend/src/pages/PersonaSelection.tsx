import { Persona } from '../types';
import { personaInfo, agents } from '../data/agents';
import { ClipboardList, Search, Shield, Layers, CheckSquare, Zap, ArrowRight } from 'lucide-react';

interface PersonaSelectionProps {
  onSelectPersona: (persona: Persona) => void;
}

const personaIcons = {
  'program-manager': ClipboardList,
  'ba-discovery': Search,
  'ba-process-intelligence': Shield,
  'solution-architect': Layers,
  'validation-lead': CheckSquare,
};

export default function PersonaSelection({ onSelectPersona }: PersonaSelectionProps) {
  const personas = Object.keys(personaInfo) as Persona[];

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0 pointer-events-none"></div>
      <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-brand-primary/40 blur-[120px] rounded-full z-0 pointer-events-none animate-pulse-glow"></div>
      <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-brand-accent/30 blur-[120px] rounded-full z-0 pointer-events-none animate-pulse-glow" style={{ animationDelay: '1s' }}></div>

      <div className="max-w-7xl w-full relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-16 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="inline-flex items-center justify-center p-1 rounded-2xl bg-gradient-to-r from-brand-primary via-brand-accent to-brand-light mb-6 shadow-2xl shadow-brand-primary/30">
            <div className="bg-brand-dark rounded-xl p-3">
              <Zap className="w-8 h-8 text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-light" stroke="url(#gradient)" />
              <svg width="0" height="0">
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop stopColor="#FF9B45" offset="0%" />
                  <stop stopColor="#F4E7E1" offset="100%" />
                </linearGradient>
              </svg>
            </div>
          </div>
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-brand-light mb-4 tracking-tight">
            Unified SDLC Accelerator
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">
            Select your role to access specialized AI-powered tools tailored for your workflow
          </p>

          <div className="flex justify-center gap-4 mt-8">
            {/* <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-700 bg-slate-800/50 text-xs font-medium text-slate-300 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              GPT-4o
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-700 bg-slate-800/50 text-xs font-medium text-slate-300 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.5s' }}></span>
              Claude 3.5 Sonnet
            </span> */}
          </div>
        </div>

        {/* Persona Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personas.map((persona, index) => {
            const info = personaInfo[persona];
            const Icon = personaIcons[persona];
            const availableAgents = agents.filter(a => a.persona === persona).length;

            return (
              <button
                key={persona}
                onClick={() => onSelectPersona(persona)}
                className="group relative bg-brand-dark/50 backdrop-blur-md rounded-2xl p-6 text-left hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand-accent/20 transition-all duration-300 animate-slide-up border border-brand-primary/30 hover:border-brand-accent"
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>

                <div className="relative z-10">
                  <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${info.color} rounded-xl mb-6 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                    {info.title}
                  </h3>

                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    {info.description}
                  </p>

                  <div className="flex items-center justify-between border-t border-brand-primary/30 pt-4">
                    <span className="text-xs font-medium text-brand-light/70 group-hover:text-brand-light transition-colors">
                      {availableAgents} {availableAgents === 1 ? 'Agent' : 'Agents'} Available
                    </span>
                    <ArrowRight className="w-5 h-5 text-brand-accent group-hover:text-white transform group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-20 text-center animate-fade-in" style={{ animationDelay: '1s' }}>
          <p className="text-sm text-brand-light/50">
            Enterprise-grade security • WCAG 2.1 AA Compliant • Zero Data Retention
          </p>
        </div>
      </div>
    </div>
  );
}
