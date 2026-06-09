# Run this script on your workstation to output a standalone physical media file.
# Requirements: pip install gTTS moviepy

import os
from gtts import gTTS

# Full conversation dialog model
transcript = [
    {
        "speaker": "SYSTEM",
        "text": "Meeting Begins",
        "time": "00:00",
        "section": "Introduction"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "Good evening everyone. Thank you for joining at short notice. I know this meeting was planned for thirty minutes, but given the current situation of the program, I believe we need to spend additional time to address concerns openly and transparently.",
        "time": "00:00",
        "section": "Introduction"
    },
    {
        "speaker": "Implementation Program Manager",
        "text": "Absolutely. Thank you for arranging this discussion. We understand the seriousness of the situation and we are committed to addressing all concerns directly.",
        "time": "00:05",
        "section": "Introduction"
    },
    {
        "speaker": "Global Delivery President",
        "text": "Good evening everyone. I appreciate the candid escalation from your side. I wanted to personally join this review because this program is strategically important for both organizations.",
        "time": "00:12",
        "section": "Introduction"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "Thank you. I will be direct. We are now two months into the engagement after the kickoff on 15th March, and expectations from our leadership were very clear \u2014 accelerate discovery, stabilize the POC approach, and establish confidence in execution. Unfortunately, we are not where we expected to be.",
        "time": "00:20",
        "section": "Introduction"
    },
    {
        "speaker": "SYSTEM",
        "text": "Short pause",
        "time": "00:35",
        "section": "Introduction"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "I want to specifically highlight three major concerns. First, several key leadership and delivery positions are still vacant. We still do not have a confirmed overall solution architect, technical architect, and data migration lead fully onboarded. Second, the current team lacks automotive domain readiness. During workshops, very common automotive quality and engineering terms like APQP, FAI, and ASPICE had to be repeatedly explained by our SMEs. That is creating concerns among our business stakeholders. Third, and most importantly, trust has started eroding. My leadership team is questioning whether the implementation team underestimated the complexity of this program.",
        "time": "00:38",
        "section": "Introduction"
    },
    {
        "speaker": "Implementation Program Manager",
        "text": "I understand the concern completely.",
        "time": "01:10",
        "section": "Introduction"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "To be fair, I also want to acknowledge positives. Your technical reputation in the PLM ecosystem is strong. Also, your own experience in leading large PLM transformations is one of the reasons we selected your organization.",
        "time": "01:13",
        "section": "Introduction"
    },
    {
        "speaker": "Global Delivery President",
        "text": "Thank you for acknowledging that. Please continue.",
        "time": "01:25",
        "section": "Introduction"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "Let me start with staffing. We were informed during mobilization that all critical roles would be onboarded by end of April. We are now in mid-May.",
        "time": "01:30",
        "section": "Staffing Gaps"
    },
    {
        "speaker": "Implementation Program Manager",
        "text": "Yes, and I accept accountability for the delay.",
        "time": "01:40",
        "section": "Staffing Gaps"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "Can you help us understand what exactly happened?",
        "time": "01:43",
        "section": "Staffing Gaps"
    },
    {
        "speaker": "Implementation Program Manager",
        "text": "Certainly. The primary challenge was availability alignment across multiple ongoing strategic programs internally. We initially identified candidates for the architect positions, but two senior resources became unavailable due to overlapping commitments and one candidate declined relocation requirements.",
        "time": "01:46",
        "section": "Staffing Gaps"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "Honestly speaking, from a customer perspective, those sound like internal execution problems. The impact is now visible in workshops.",
        "time": "02:05",
        "section": "Staffing Gaps"
    },
    {
        "speaker": "Implementation Program Manager",
        "text": "I agree.",
        "time": "02:15",
        "section": "Staffing Gaps"
    },
    {
        "speaker": "Global Delivery President",
        "text": "Let me step in here. We should have escalated this earlier and provided contingency staffing. That did not happen quickly enough. I take responsibility for that gap.",
        "time": "02:17",
        "section": "Staffing Gaps"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "I appreciate the transparency.",
        "time": "02:28",
        "section": "Staffing Gaps"
    },
    {
        "speaker": "Global Delivery President",
        "text": "Effective immediately, we are assigning this program as a Tier-1 strategic delivery initiative. I have already initiated approvals to onboard: A senior global PLM solution architect with automotive experience, a dedicated technical architecture lead, and a data migration lead with prior NX and SAP integration experience. The onboarding timelines will be committed before end of this meeting.",
        "time": "02:32",
        "section": "Staffing Gaps"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "That is good to hear, but our concern is not just allocation on paper. We need active participation in workshops starting immediately.",
        "time": "02:55",
        "section": "Staffing Gaps"
    },
    {
        "speaker": "Global Delivery President",
        "text": "Understood.",
        "time": "03:05",
        "section": "Staffing Gaps"
    },
    {
        "speaker": "Implementation Program Manager",
        "text": "We can arrange shadow participation from tomorrow while formal onboarding completes.",
        "time": "03:08",
        "section": "Staffing Gaps"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "That would help.",
        "time": "03:15",
        "section": "Staffing Gaps"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "Let us move to the second concern \u2014 domain readiness. During last week\u2019s APQP process workshop, basic automotive lifecycle terminology had to be explained multiple times. Our manufacturing quality lead was visibly frustrated.",
        "time": "03:18",
        "section": "Automotive Domain Knowledge Gaps"
    },
    {
        "speaker": "Implementation Program Manager",
        "text": "Yes, I was informed about that workshop.",
        "time": "03:35",
        "section": "Automotive Domain Knowledge Gaps"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "This is not about blaming individuals. But our expectation was that the implementation team would come prepared for an automotive transformation, not learn the industry vocabulary during discovery.",
        "time": "03:39",
        "section": "Automotive Domain Knowledge Gaps"
    },
    {
        "speaker": "Global Delivery President",
        "text": "Fair point.",
        "time": "03:52",
        "section": "Automotive Domain Knowledge Gaps"
    },
    {
        "speaker": "Implementation Program Manager",
        "text": "I would like to clarify one thing. The current team has strong PLM platform implementation expertise. Their previous implementation experience has largely been in telecom and industrial manufacturing sectors.",
        "time": "03:55",
        "section": "Automotive Domain Knowledge Gaps"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "We recognize their technical strengths. The issue is contextual understanding.",
        "time": "04:10",
        "section": "Automotive Domain Knowledge Gaps"
    },
    {
        "speaker": "Implementation Program Manager",
        "text": "Agreed.",
        "time": "04:16",
        "section": "Automotive Domain Knowledge Gaps"
    },
    {
        "speaker": "Global Delivery President",
        "text": "We have already started corrective actions. Starting next Monday, we will run an accelerated automotive domain enablement program for all delivery members. It will include: Automotive product development lifecycle, APQP process understanding, FAI workflows, ASPICE fundamentals, Supplier collaboration processes, and Change and release governance specific to automotive manufacturing.",
        "time": "04:19",
        "section": "Automotive Domain Knowledge Gaps"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "That is useful. But the customer cannot become the training organization for the implementation team.",
        "time": "04:45",
        "section": "Automotive Domain Knowledge Gaps"
    },
    {
        "speaker": "Global Delivery President",
        "text": "Understood completely.",
        "time": "04:52",
        "section": "Automotive Domain Knowledge Gaps"
    },
    {
        "speaker": "Implementation Program Manager",
        "text": "Additionally, we propose embedding one automotive domain consultant directly into the discovery and POC tracks for the next eight weeks.",
        "time": "04:56",
        "section": "Automotive Domain Knowledge Gaps"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "That would significantly improve workshop confidence.",
        "time": "05:08",
        "section": "Automotive Domain Knowledge Gaps"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "I want to be very transparent. The escalation to your global leadership was not done lightly. Our executive steering committee has started asking whether the overall timeline is still achievable.",
        "time": "05:14",
        "section": "Program Confidence & Escalation"
    },
    {
        "speaker": "Implementation Program Manager",
        "text": "I understand.",
        "time": "05:28",
        "section": "Program Confidence & Escalation"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "We are particularly worried because the roadmap already has overlapping workstreams. If Phase-1 discovery and solution design slips significantly, downstream sprint development and pilot rollout will compress.",
        "time": "05:31",
        "section": "Program Confidence & Escalation"
    },
    {
        "speaker": "Global Delivery President",
        "text": "We reviewed the roadmap before joining this meeting. While recovery will require disciplined execution, I still believe the overall program timeline can be stabilized.",
        "time": "05:45",
        "section": "Program Confidence & Escalation"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "What gives you confidence?",
        "time": "05:58",
        "section": "Program Confidence & Escalation"
    },
    {
        "speaker": "Global Delivery President",
        "text": "Two reasons. First, technically, the solution landscape is within our core capability. SAP integration, NX integration, Cadence integration, and PLM migration are areas we have delivered repeatedly. Second, despite current challenges, the foundational governance structure is not broken. We still have an opportunity to recover within the current quarter if we act decisively now.",
        "time": "06:01",
        "section": "Program Confidence & Escalation"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "Recovery needs visible execution, not only confidence statements.",
        "time": "06:25",
        "section": "Program Confidence & Escalation"
    },
    {
        "speaker": "Global Delivery President",
        "text": "Agreed.",
        "time": "06:31",
        "section": "Program Confidence & Escalation"
    },
    {
        "speaker": "Implementation Program Manager",
        "text": "We have already started restructuring the daily governance cadence internally.",
        "time": "06:34",
        "section": "Program Confidence & Escalation"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "Explain that please.",
        "time": "06:40",
        "section": "Program Confidence & Escalation"
    },
    {
        "speaker": "Implementation Program Manager",
        "text": "We are implementing: 1. Daily internal war-room reviews. 2. Twice-weekly customer checkpoint meetings. 3. Mandatory workshop preparation reviews. 4. Early risk escalation governance. 5. Dependency tracking across integration and data migration streams.",
        "time": "06:43",
        "section": "Program Confidence & Escalation"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "That is a step in the right direction.",
        "time": "07:05",
        "section": "Program Confidence & Escalation"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "Let us discuss the immediate deliverables. Which Phase-1 items are currently at risk?",
        "time": "07:10",
        "section": "POC & Discovery Delays"
    },
    {
        "speaker": "Implementation Program Manager",
        "text": "Currently: End-to-end discovery sign-off is delayed by approximately three weeks. Data migration assessment is partially blocked due to the pending lead onboarding. Integration architecture decisions are progressing slower than planned. Quality management workflows require additional clarification workshops.",
        "time": "07:16",
        "section": "POC & Discovery Delays"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "What about the POC environment?",
        "time": "07:38",
        "section": "POC & Discovery Delays"
    },
    {
        "speaker": "Implementation Program Manager",
        "text": "Core environment setup is progressing. Technically there are no blockers, but business scenario validation is slower because domain alignment workshops are taking longer.",
        "time": "07:42",
        "section": "POC & Discovery Delays"
    },
    {
        "speaker": "Global Delivery President",
        "text": "I want to add something important here. We should not try to artificially recover schedule by compromising discovery quality. A weak discovery phase will create larger downstream defects during sprint execution.",
        "time": "07:55",
        "section": "POC & Discovery Delays"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "I agree with that.",
        "time": "08:12",
        "section": "POC & Discovery Delays"
    },
    {
        "speaker": "Global Delivery President",
        "text": "Instead, we propose a focused recovery plan: Parallelize architecture and business discovery activities, add senior SMEs into critical workshops, prioritize high-risk integration scenarios first, and freeze core scope boundaries within the next ten business days.",
        "time": "08:16",
        "section": "POC & Discovery Delays"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "That sounds reasonable.",
        "time": "08:35",
        "section": "POC & Discovery Delays"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "I need one thing very clearly stated today. Can your organization commit that the required leadership team will be fully mobilized within one week?",
        "time": "08:40",
        "section": "Commitments & Expectations"
    },
    {
        "speaker": "Global Delivery President",
        "text": "Yes.",
        "time": "08:50",
        "section": "Commitments & Expectations"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "Including named resources?",
        "time": "08:52",
        "section": "Commitments & Expectations"
    },
    {
        "speaker": "Global Delivery President",
        "text": "Yes. Named resources with confirmed availability.",
        "time": "08:55",
        "section": "Commitments & Expectations"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "And automotive domain support?",
        "time": "09:00",
        "section": "Commitments & Expectations"
    },
    {
        "speaker": "Global Delivery President",
        "text": "Yes. We will provide both domain consulting support and structured enablement.",
        "time": "09:04",
        "section": "Commitments & Expectations"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "Good.",
        "time": "09:10",
        "section": "Commitments & Expectations"
    },
    {
        "speaker": "Implementation Program Manager",
        "text": "From my side, I also want to acknowledge the customer team\u2019s patience during the last few weeks. Despite the concerns, your SMEs have continued supporting workshops constructively.",
        "time": "09:13",
        "section": "Commitments & Expectations"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "We all want the program to succeed. But we also need confidence that the execution model is stabilizing.",
        "time": "09:28",
        "section": "Commitments & Expectations"
    },
    {
        "speaker": "Global Delivery President",
        "text": "Completely understood.",
        "time": "09:38",
        "section": "Commitments & Expectations"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "Before we close, I want to summarize what we expect before next week\u2019s review: 1. Full staffing closure for key open positions. 2. Clear recovery plan with milestones. 3. Automotive domain enablement completion schedule. 4. Revised discovery and POC timeline. 5. Improved workshop preparedness.",
        "time": "09:42",
        "section": "Closing & Next Steps"
    },
    {
        "speaker": "Implementation Program Manager",
        "text": "We will deliver all five items.",
        "time": "10:05",
        "section": "Closing & Next Steps"
    },
    {
        "speaker": "Global Delivery President",
        "text": "I will personally review progress every forty-eight hours until the program stabilizes.",
        "time": "10:10",
        "section": "Closing & Next Steps"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "Thank you.",
        "time": "10:18",
        "section": "Closing & Next Steps"
    },
    {
        "speaker": "SYSTEM",
        "text": "Small pause",
        "time": "10:20",
        "section": "Closing & Next Steps"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "I appreciate the openness in today\u2019s discussion. The situation is serious, but if corrective actions are executed quickly, we still have an opportunity to recover momentum.",
        "time": "10:23",
        "section": "Closing & Next Steps"
    },
    {
        "speaker": "Global Delivery President",
        "text": "We value the partnership and we are committed to rebuilding confidence through execution.",
        "time": "10:38",
        "section": "Closing & Next Steps"
    },
    {
        "speaker": "Implementation Program Manager",
        "text": "Thank you everyone.",
        "time": "10:48",
        "section": "Closing & Next Steps"
    },
    {
        "speaker": "Customer Program Manager",
        "text": "Alright. Let us reconvene next Friday with measurable progress updates. Meeting adjourned.",
        "time": "10:52",
        "section": "Closing & Next Steps"
    },
    {
        "speaker": "SYSTEM",
        "text": "Meeting Ends",
        "time": "11:05",
        "section": "Closing & Next Steps"
    }
]

print("Starting pipeline compilation...")
full_text = ""
for entry in transcript:
    if entry['speaker'] != 'SYSTEM':
        full_text += f"{entry['speaker']}: {entry['text']}\n\n"
    else:
        full_text += f"[{entry['text']}]\n\n"

# Render the compiled text synthesis asset
print("Generating speech audio tracks...")
tts = gTTS(text=full_text, lang='en', tld='com')
audio_path = "PLM_Program_Escalation_Meeting.mp3"
tts.save(audio_path)
print(f"Success! Standalone physical media file compiled and exported to: {os.path.abspath(audio_path)}")
print("To map this to a physical container like an MP4 with a static card, use moviepy to combine it.")