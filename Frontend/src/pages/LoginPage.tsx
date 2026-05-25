import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Persona } from '../types';
import { personaInfo } from '../data/agents';
import { LogIn, User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  persona: Persona;
  onLogin: () => void;
  onBack: () => void;
}

export default function LoginPage({ persona, onLogin, onBack }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const info = personaInfo[persona];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login delay
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 800);
  };

  const handleGuestLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className={`absolute top-0 left-0 w-full h-1/2 bg-gradient-to-br ${info.color} opacity-10 rounded-b-[100px] blur-3xl transform -translate-y-1/2`}></div>
      <div className={`absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl ${info.color} opacity-5 rounded-full blur-3xl transform translate-x-1/3 translate-y-1/3`}></div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${info.color} rounded-2xl mb-6 shadow-lg shadow-brand-primary/20`}>
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-brand-light/80">
            Sign in as <span className="font-semibold text-white">{info.title}</span>
          </p>
        </div>

        <div className="bg-brand-dark/50 backdrop-blur-md rounded-2xl shadow-xl border border-brand-primary/30 p-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-brand-light mb-1.5">Work Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-brand-light/50" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-brand-primary/30 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent bg-brand-dark/50 text-white placeholder-brand-light/30 transition-colors"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-light mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-brand-light/50" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-brand-primary/30 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent bg-brand-dark/50 text-white placeholder-brand-light/30 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex justify-end mt-1.5">
                <a href="#" className="text-xs font-medium text-brand-accent hover:text-brand-light">Forgot password?</a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r ${info.color} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent focus:ring-offset-brand-dark transition-all ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              Sign In
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-primary/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-brand-dark text-brand-light/60">Or</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGuestLogin}
                type="button"
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-brand-primary/40 rounded-lg shadow-sm text-sm font-medium text-brand-light bg-brand-dark/30 hover:bg-brand-primary/20 hover:border-brand-primary transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent focus:ring-offset-brand-dark"
              >
                Continue as Guest <ArrowRight className="w-4 h-4 text-brand-light/70" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <button 
            onClick={onBack}
            className="text-sm font-medium text-brand-light/60 hover:text-white transition-colors"
          >
            ← Back to Role Selection
          </button>
        </div>
      </div>
    </div>
  );
}
