export const mockIntelliPMOutput = {
  project_health_summary: "Project is currently at medium risk with 3 critical actions pending and 2 schedule alerts. Budget variance is within acceptable limits at 5% over.",
  top_actions: [
    { action: "Resolve API integration issues with payment gateway", owner: "John Smith", due_date: "2026-02-15" },
    { action: "Complete security audit documentation", owner: "Sarah Johnson", due_date: "2026-02-10" },
    { action: "Finalize database migration strategy", owner: "Mike Chen", due_date: "2026-02-20" }
  ],
  risks: [
    { risk: "Delayed third-party API delivery", impact: "high", mitigation: "Implement fallback API provider" },
    { risk: "Insufficient test coverage for core modules", impact: "medium", mitigation: "Allocate additional QA resources" },
    { risk: "Key developer on leave during critical phase", impact: "medium", mitigation: "Cross-train team members" }
  ],
  action_tracker: [
    { id: "ACT-001", status: "open", age_days: 14, description: "Complete UAT environment setup" },
    { id: "ACT-002", status: "closed", age_days: 7, description: "Update deployment scripts" },
    { id: "ACT-003", status: "open", age_days: 21, description: "Resolve performance issues in reporting module" }
  ],
  schedule_alerts: [
    { milestone: "Sprint 5 Completion", expected_date: "2026-02-28", variance_days: -3 },
    { milestone: "Integration Testing", expected_date: "2026-03-15", variance_days: 5 }
  ]
};

export const mockBADiscoveryOutput = {
  user_stories: [
    { as_a: "Customer", i_want: "to view my order history", so_that: "I can track past purchases" },
    { as_a: "Admin", i_want: "to generate sales reports", so_that: "I can analyze business performance" },
    { as_a: "Manager", i_want: "to approve refund requests", so_that: "I can maintain quality control" }
  ],
  requirements: [
    { id: "R1", description: "System shall support OAuth 2.0 authentication" },
    { id: "R2", description: "Dashboard must load within 2 seconds" },
    { id: "R3", description: "All data must be encrypted at rest using AES-256" }
  ],
  pain_points: [
    "Current manual process takes 2-3 hours per transaction",
    "No visibility into order status after submission",
    "Multiple systems require separate logins"
  ],
  meeting_summary: "Workshop focused on streamlining the order management process. Key stakeholders identified need for real-time visibility and reduced manual intervention.",
  gaps: [
    { gap: "No mobile app for field staff", impact: "Delayed order processing" },
    { gap: "Manual reconciliation required", impact: "Increased error rate" }
  ],
  follow_up_questions: [
    "What is the expected peak concurrent user load?",
    "Are there specific compliance requirements for data retention?",
    "Which legacy systems need to be integrated?"
  ]
};

export const mockBAProcessOutput = {
  risk_score: 68,
  compliance_checks: [
    { rule_id: "GDPR-5", status: "pass", evidence: "Data retention policy documented in section 4.2" },
    { rule_id: "GDPR-7", status: "fail", evidence: "No evidence of data subject consent workflow" },
    { rule_id: "HIPAA-164.312", status: "partial", evidence: "Encryption implemented but audit logging incomplete" },
    { rule_id: "SOC2-CC6.1", status: "pass", evidence: "Access controls properly configured" }
  ],
  process_gaps: [
    "Missing data breach notification procedure",
    "Incomplete access control documentation",
    "No regular compliance audit schedule"
  ],
  benchmark_comparisons: "Process maturity is at Level 2 (Managed) compared to industry benchmark of Level 3 (Defined). Key gaps in documentation and automation."
};

export const mockFitGapOutput = {
  overall_fit_score: 0.73,
  fit_gap_matrix: [
    { requirement: "User authentication with SSO", fit_status: "fit", effort_estimate: 0, reason: "Platform supports SAML and OAuth 2.0 out of the box" },
    { requirement: "Custom approval workflow", fit_status: "configuration", effort_estimate: 3, reason: "Workflow engine available, requires configuration" },
    { requirement: "Real-time inventory sync", fit_status: "customisation", effort_estimate: 8, reason: "API integration required with custom middleware" },
    { requirement: "Biometric authentication", fit_status: "gap", effort_estimate: 21, reason: "Not supported by platform, requires third-party integration" },
    { requirement: "Multi-currency support", fit_status: "fit", effort_estimate: 0, reason: "Built-in internationalization module" }
  ],
  customizations_count: 1,
  technical_risk: "medium",
  architecture_recommendation: "Leverage OOTB capabilities for 60% of requirements. Implement custom middleware layer for inventory integration. Consider alternative for biometric auth or evaluate third-party add-ons."
};

export const mockTraceabilityOutput = {
  coverage_score: 0.85,
  test_scenarios: [
    { id: "T1", requirement_id: "R1", steps: ["Navigate to login page", "Click SSO button", "Enter credentials", "Verify redirect"], expected: "User successfully logged in" },
    { id: "T2", requirement_id: "R2", steps: ["Login to dashboard", "Record page load time"], expected: "Dashboard loads in < 2 seconds" },
    { id: "T3", requirement_id: "R3", steps: ["Access database", "Verify encryption settings"], expected: "AES-256 encryption enabled" }
  ],
  traceability_matrix: [
    { requirement_id: "R1", test_ids: ["T1", "T4"] },
    { requirement_id: "R2", test_ids: ["T2"] },
    { requirement_id: "R3", test_ids: ["T3", "T5"] }
  ],
  acceptance_criteria: [
    "Given a user with valid SSO credentials, When they attempt to login, Then they should be authenticated within 3 seconds",
    "Given dashboard is accessed, When page loads, Then all widgets should render within 2 seconds",
    "Given data is stored, When database is inspected, Then all PII fields should be encrypted with AES-256"
  ]
};
