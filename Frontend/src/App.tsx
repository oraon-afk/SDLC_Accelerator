import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Persona } from './types';
import PersonaSelection from './pages/PersonaSelection';
import Dashboard from './pages/Dashboard';
import AgentWorkspace from './pages/AgentWorkspace';
import IntelliPMPage from './pages/IntelliPMPage';
import LoginPage from './pages/LoginPage';
import DocumentHub from './pages/DocumentHub';

/**
 * Main Application Component
 * 
 * Manages persona selection state and routing for the Unified SDLC Accelerator.
 * Uses React Router for navigation between different views based on user's selected role.
 */
function App() {
  // Global state: Currently selected persona (null = not logged in)
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogout = () => {
    setSelectedPersona(null);
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Routes>
          <Route
            path="/"
            element={
              selectedPersona ?
                (isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />) :
                <PersonaSelection onSelectPersona={setSelectedPersona} />
            }
          />
          <Route
            path="/login"
            element={
              selectedPersona ?
                (isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage persona={selectedPersona} onLogin={() => setIsAuthenticated(true)} onBack={() => setSelectedPersona(null)} />) :
                <Navigate to="/" replace />
            }
          />
          <Route
            path="/dashboard"
            element={
              selectedPersona && isAuthenticated ?
                <Dashboard persona={selectedPersona} onChangePersona={handleLogout} /> :
                (selectedPersona ? <Navigate to="/login" replace /> : <Navigate to="/" replace />)
            }
          />
          <Route
            path="/agent/intelli-pm"
            element={
              selectedPersona && isAuthenticated ?
                <IntelliPMPage persona={selectedPersona} onChangePersona={handleLogout} /> :
                (selectedPersona ? <Navigate to="/login" replace /> : <Navigate to="/" replace />)
            }
          />
          <Route
            path="/agent/:agentId"
            element={
              selectedPersona && isAuthenticated ?
                <AgentWorkspace persona={selectedPersona} onChangePersona={handleLogout} /> :
                (selectedPersona ? <Navigate to="/login" replace /> : <Navigate to="/" replace />)
            }
          />
          <Route
            path="/documents"
            element={
              selectedPersona && isAuthenticated ?
                <DocumentHub persona={selectedPersona} onChangePersona={handleLogout} /> :
                (selectedPersona ? <Navigate to="/login" replace /> : <Navigate to="/" replace />)
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
