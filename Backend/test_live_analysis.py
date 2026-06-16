import sys
import os
import json

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from Controller.controller import analyze_project_payload, AnalysisRequestPayload, ProjectDetails, AnalysisConfig, UploadedFileMeta

def run_test():
    print("====================================================")
    print("LIVE PIPELINE END-TO-END VERIFICATION")
    print("====================================================")
    
    # 1. Build a dummy payload representing the React workspace frontend request
    payload = AnalysisRequestPayload(
        project_id="1",
        project_name="Automotive_PLM_Consolidation",
        project_details=ProjectDetails(
            objective={
                "businessGoal": "Consolidate global legacy PLM program streams into a unified high-performance platform.",
                "expectedOutcome": "Reduced pipeline cycle variance, consolidated licensing costs, and streamlined automotive component engineering compliance."
            },
            scope={
                "featuresIncluded": ["APQP integration", "CAD asset migrations", "Change management workflows"],
                "featuresExcluded": ["Legacy system hotfixes", "On-prem infrastructure hosting"]
            },
            stakeholders={
                "businessOwner": ["Global Delivery President", "Customer PM"],
                "technicalOwner": ["Tech Arch", "QA Lead"]
            },
            budgetResources={
                "teamSize": "45 members globally",
                "costEstimation": "$2,500,000 USD",
                "toolRequirements": "Windchill, Siemens Teamcenter, AWS Cloud, Ollama Integration"
            },
            successMetrics={
                "performanceTargets": ["99% platform availability", "Migration throughput > 500 components/day"],
                "userAdoption": ["80% user transition in 60 days"],
                "timeReduction": ["Automotive engineering compliance approvals reduced by 30%"]
            }
        ),
        analysis_config=AnalysisConfig(
            modules={
                "riskDetection": True,
                "actionTracking": True,
                "scheduleAnalysis": True,
                "escalationPrediction": True
            },
            priority="High",
            timeHorizon="Entire project",
            notes="Look closely at the delayed UAT sign-off and the Solution/Technical architect staffing gaps discussed in the weekly reviews."
        ),
        uploaded_files=[
            UploadedFileMeta(name="Plm Program Weekly Review Meeting minutes.docx", size=92212, type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            UploadedFileMeta(name="Master RAID Tracker.csv", size=1393, type="text/csv")
        ]
    )

    print("[Pipeline Test] Triggering analyze_project_payload handler...")
    
    # Call the actual pipeline directly in Python
    import asyncio
    result = asyncio.run(analyze_project_payload(payload))
    
    print("\n[Pipeline Test] COMPLETED successfully. Analysis Result JSON output:")
    print("----------------------------------------------------")
    print(json.dumps(result, indent=2))
    print("----------------------------------------------------")
    
    print("\n====================================================")
    print("PIPELINE TEST COMPLETED")
    print("====================================================")

if __name__ == "__main__":
    run_test()
