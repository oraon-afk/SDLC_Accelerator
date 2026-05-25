import { Agent } from '../types';

export const agents: Agent[] = [
  {
    id: 'intelli-pm',
    name: 'IntellI-PM',
    description: 'Program Manager Agent - Detects project risks, actions, schedule alerts, and budget variances from uploaded documents.',
    persona: 'program-manager',
    icon: 'ClipboardList'
  },
  {
    id: 'ba-discovery',
    name: 'BA Discovery',
    description: 'Converts raw discovery notes into user stories, requirements, pain points, and gaps.',
    persona: 'ba-discovery',
    icon: 'Search'
  },
  {
    id: 'ba-process-intelligence',
    name: 'BA Process Intelligence',
    description: 'Compliance checking of process documentation against selected frameworks (GDPR, HIPAA, SOC2, ISO 27001, ITIL).',
    persona: 'ba-process-intelligence',
    icon: 'Shield'
  },
  {
    id: 'solution-fit-gap',
    name: 'Solution Fit-Gap',
    description: 'Maps requirements to OOTB platform capabilities, identifies fit/config/customisation/gap.',
    persona: 'solution-architect',
    icon: 'Layers'
  },
  {
    id: 'validation-traceability',
    name: 'Validation Traceability',
    description: 'Creates test scenarios, acceptance criteria, and traceability matrix from requirements.',
    persona: 'validation-lead',
    icon: 'CheckSquare'
  }
];

export const personaInfo = {
  'program-manager': {
    title: 'Program Manager',
    description: 'Manage project health, risks, and actions',
    color: 'from-brand-primary to-brand-dark'
  },
  'ba-discovery': {
    title: 'Business Analyst - Discovery',
    description: 'Extract requirements from discovery sessions',
    color: 'from-brand-accent to-brand-primary'
  },
  'ba-process-intelligence': {
    title: 'Business Analyst - Process Intelligence',
    description: 'Ensure compliance and process quality',
    color: 'from-brand-dark to-brand-primary'
  },
  'solution-architect': {
    title: 'Solution Architect',
    description: 'Analyze solution fit and gaps',
    color: 'from-brand-accent to-brand-primary'
  },
  'validation-lead': {
    title: 'Validation Lead',
    description: 'Create test scenarios and traceability',
    color: 'from-brand-primary to-brand-dark'
  }
};
