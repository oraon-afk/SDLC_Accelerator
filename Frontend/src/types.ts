export type Persona = 
  | 'program-manager'
  | 'ba-discovery'
  | 'ba-process-intelligence'
  | 'solution-architect'
  | 'validation-lead';

export interface Agent {
  id: string;
  name: string;
  description: string;
  persona: Persona;
  icon: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  parsedText?: string;
}

export interface AgentSession {
  id: string;
  agentId: string;
  agentName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  documents: Document[];
  output?: any;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  sessions: AgentSession[];
}
