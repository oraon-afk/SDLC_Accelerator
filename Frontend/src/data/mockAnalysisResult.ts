import type { AnalysisResult } from '../types/intellipm';

/**
 * NA-valued skeleton used only when the backend is completely unreachable.
 * Contains NO fabricated/static project data — all fields are empty or "NA".
 */
export const emptyAnalysisResult: AnalysisResult = {
  analysis_timestamp: new Date().toISOString(),
  priority_level: 'NA',
  project_health_summary: {
    overall_health: 'NA',
    narrative:
      'Analysis data is not available. The backend AI service could not be reached. Please ensure the Ollama server is running and try again.',
    health_factors: {
      schedule: 'NA',
      resources: 'NA',
      quality: 'NA',
    },
  },
  top_actions: [],
  action_tracker: {
    total_actions: 0,
    open_actions: 0,
    overdue_actions: 0,
    avg_age_open_days: 0,
    actions_by_owner: {},
  },
  risks: [],
  schedule_alerts: [],
  escalation_prediction: {
    likelihood: 'NA',
    indicators: [],
    recommended_actions: [],
  },
  confidence_scores: {
    overall: 0,
    risk_detection: 0,
    action_tracking: 0,
    schedule_analysis: 0,
  },
  source_artifacts: [],
};
