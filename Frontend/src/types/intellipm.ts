export type HealthColor = 'Green' | 'Yellow' | 'Red';
export type ImpactLevel = 'High' | 'Medium' | 'Low';
export type EscalationLikelihood = 'High' | 'Medium' | 'Low';
export type PriorityLevel = 'High' | 'Medium' | 'Low';
export type TimeHorizon = 'Next 2 weeks' | '1 month' | 'Entire project';
export type TabId = 'summary' | 'risks' | 'actions' | 'schedule' | 'export';

export interface AnalysisModules {
  riskDetection: boolean;
  actionTracking: boolean;
  scheduleAnalysis: boolean;
  escalationPrediction: boolean;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'ready' | 'error';
  errorMessage?: string;
}

export interface TopAction {
  action: string;
  owner: string;
  due_date: string;
  status: string;
  age_days: number;
  priority: string;
  source_file?: string;
}

export interface Risk {
  risk: string;
  impact: ImpactLevel;
  probability: ImpactLevel;
  mitigation: string;
  owner: string;
  status: string;
  source_file?: string;
}

export interface ScheduleAlert {
  milestone: string;
  baseline_date: string;
  forecast_date: string;
  variance_days: number;
  reason: string;
  critical_path_flag: boolean;
  source_file?: string;
}



export interface ActionTracker {
  total_actions: number;
  open_actions: number;
  overdue_actions: number;
  avg_age_open_days: number;
  actions_by_owner: Record<string, number>;
}

export interface DocumentSummaryItem {
  file_name: string;
  summary: string;
}

export interface AnalysisResult {
  analysis_timestamp: string;
  priority_level: string;
  project_health_summary: {
    overall_health: HealthColor;
    narrative: string;
    health_factors: {
      schedule: string;
      resources: string;
      quality: string;
    };
  };
  top_actions: TopAction[];
  action_tracker: ActionTracker;
  document_summary?: DocumentSummaryItem[];
  risks: Risk[];
  schedule_alerts: ScheduleAlert[];

  escalation_prediction: {
    likelihood: EscalationLikelihood;
    indicators: string[];
    recommended_actions: string[];
  } | null;
  confidence_scores: {
    overall: number;
    risk_detection: number;
    action_tracking: number;
    schedule_analysis: number;
  };
  source_artifacts: string[];
}
