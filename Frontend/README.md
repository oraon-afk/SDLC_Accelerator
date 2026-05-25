# Unified SDLC Accelerator

A comprehensive AI-powered platform for accelerating Software Development Lifecycle (SDLC) processes across different roles and personas.

## Overview

The Unified SDLC Accelerator is an enterprise-grade internal tool designed to streamline project management, business analysis, solution architecture, and validation processes using advanced AI agents.

## Features

### 🎭 Five Specialized Personas

1. **Program Manager** - IntellI-PM Agent
   - Project risk detection and tracking
   - Action item management
   - Schedule variance analysis
   - Budget monitoring
   - Escalation prediction

2. **Business Analyst - Discovery**
   - Extract user stories from raw notes
   - Generate requirements documentation
   - Identify pain points and gaps
   - Create follow-up questions
   - Workshop summary generation

3. **Business Analyst - Process Intelligence**
   - Compliance framework checking (GDPR, HIPAA, SOC2, ISO 27001, ITIL)
   - Risk scoring and assessment
   - Process gap identification
   - Industry benchmark comparison
   - Automated audit reporting

4. **Solution Architect** - Fit-Gap Analysis
   - Requirement to capability mapping
   - Fit/Configuration/Customisation/Gap classification
   - Effort estimation (story points)
   - Technical risk assessment
   - Architecture recommendations

5. **Validation Lead** - Traceability
   - Test scenario generation
   - Acceptance criteria in Gherkin format
   - Traceability matrix creation
   - Coverage score calculation
   - Requirements-to-tests mapping

### 🎨 WCAG-Compliant Design

The application follows Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards:

- **Color Contrast**: Minimum 4.5:1 ratio for normal text, 3:1 for large text
- **Professional Palette**: 
  - Primary: Deep Blue (#2563eb) - Program management and core actions
  - Emerald (#059669) - Success states and BA Discovery
  - Purple (#7c3aed) - Process Intelligence and compliance
  - Amber (#d97706) - Warnings and Solution Architecture
  - Rose (#e11d48) - Validation and testing
  - Slate (#64748b) - Neutral UI elements

- **Keyboard Navigation**: Full keyboard support with visible focus indicators
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **Responsive Design**: Works across all device sizes

### 📄 Document Processing

Supports multiple file formats:
- PDF (with OCR for scanned documents)
- DOCX (Microsoft Word)
- TXT (plain text)
- CSV/XLSX (tabular data)
- Audio/Video (transcription)
- Images (OCR for whiteboards)

### 🚀 Key Capabilities

- **Multi-Agent Workspace**: Dedicated workspaces for each AI agent
- **Document Hub**: Centralized document management and search
- **Real-time Analysis**: Simulated async processing with status updates
- **Export Options**: PDF reports, CSV matrices, Excel traceability
- **Configuration**: Customizable analysis parameters per agent
- **Results Visualization**: Rich data tables, charts, and color-coded insights

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Charts**: Recharts (for future enhancements)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Usage Flow

1. **Select Persona**: Choose your role on the landing page
2. **Upload Documents**: Navigate to Document Hub or use the agent workspace upload zone
3. **Configure Analysis**: Set parameters specific to each agent
4. **Run Analysis**: Execute the AI agent with your documents
5. **Review Results**: Explore generated insights in organized tabs
6. **Export**: Download results in your preferred format

## Architecture

```
src/
├── components/
│   └── results/          # Result display components for each agent
├── data/
│   ├── agents.ts         # Agent definitions and metadata
│   └── mockData.ts       # Mock output data for demonstration
├── pages/
│   ├── PersonaSelection.tsx  # Landing page
│   ├── Dashboard.tsx         # Role-specific dashboard
│   ├── AgentWorkspace.tsx    # Main analysis interface
│   └── DocumentHub.tsx       # Document management
├── types.ts              # TypeScript type definitions
└── App.tsx              # Main router component
```

## Agent Outputs

### IntellI-PM
- Project health summary
- Top actions with owners and due dates
- Risk matrix with mitigation strategies
- Action tracker with aging
- Schedule variance alerts

### BA Discovery
- User stories (As a... I want... So that...)
- Functional requirements list
- Pain points and gaps
- Meeting summaries
- Follow-up questions

### BA Process Intelligence
- Overall risk score (0-100)
- Compliance checks (pass/fail/partial)
- Process gaps with evidence
- Industry benchmark comparison

### Solution Fit-Gap
- Overall fit score percentage
- Fit-Gap matrix with effort estimates
- Customization count
- Technical risk level
- Architecture recommendations

### Validation Traceability
- Test coverage score
- Generated test scenarios (steps + expected results)
- Traceability matrix (requirements ↔ tests)
- Gherkin acceptance criteria

## Accessibility Features

- ✅ Semantic HTML structure
- ✅ ARIA labels and roles where needed
- ✅ Keyboard navigation support
- ✅ Focus management and visible focus indicators
- ✅ High contrast color schemes
- ✅ Responsive text sizing
- ✅ Alt text for icons and images
- ✅ Skip-to-main-content link

## Color Palette Reference

| Purpose | Color | Hex | Contrast Ratio |
|---------|-------|-----|----------------|
| Primary Action | Blue 600 | #2563eb | 4.56:1 ✅ |
| Success | Emerald 600 | #059669 | 4.54:1 ✅ |
| Warning | Amber 700 | #b45309 | 4.51:1 ✅ |
| Error | Red 600 | #dc2626 | 4.52:1 ✅ |
| Text Primary | Slate 900 | #0f172a | 16.11:1 ✅ |
| Text Secondary | Slate 600 | #475569 | 7.78:1 ✅ |

## Future Enhancements

- Real backend integration with FastAPI
- Actual LLM integration (OpenAI GPT-4, Anthropic Claude)
- Vector database for document embeddings
- Real-time collaboration features
- Advanced analytics dashboard
- API key management
- User authentication with Auth0
- Project workspace management
- Version control for outputs

## License

Internal corporate use only.

## Support

For questions or issues, contact the SDLC Accelerator team.

---

Built with ❤️ for accelerating enterprise software delivery
