# User Guide - Unified SDLC Accelerator

Welcome to the Unified SDLC Accelerator! This guide will help you get started with AI-powered tools designed to streamline your software development lifecycle.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Selecting Your Role](#selecting-your-role)
3. [Using AI Agents](#using-ai-agents)
4. [Managing Documents](#managing-documents)
5. [Understanding Results](#understanding-results)
6. [Exporting Your Work](#exporting-your-work)
7. [Tips & Best Practices](#tips--best-practices)

## Getting Started

### First Time Login
1. Navigate to the SDLC Accelerator homepage
2. You'll see 5 role cards representing different personas
3. Select the role that matches your current task

### Navigation
- **Dashboard Icon** - Return to your role dashboard
- **Documents** - Access the document hub
- **Change Role** - Switch to a different persona
- **Logout** - Return to role selection screen

## Selecting Your Role

Choose the role that best fits your current activity:

### 🎯 Program Manager
**Best for**: Project tracking, risk management, action items

Use the **IntellI-PM** agent when you need to:
- Monitor project health
- Track actions and owners
- Identify risks early
- Analyze schedule variances
- Monitor budget deviations

**Typical Documents**: Project plans, status reports, meeting notes, timesheets

---

### 🔍 Business Analyst - Discovery
**Best for**: Requirements gathering, workshop facilitation

Use the **BA Discovery** agent when you need to:
- Convert workshop notes into user stories
- Extract requirements from meeting transcripts
- Identify pain points
- Discover process gaps
- Generate follow-up questions

**Typical Documents**: Meeting notes, interview transcripts, workshop photos (whiteboards)

---

### 🛡️ Business Analyst - Process Intelligence
**Best for**: Compliance checking, process validation

Use the **BA Process Intelligence** agent when you need to:
- Check compliance with GDPR, HIPAA, SOC2, ISO 27001
- Assess process maturity
- Identify compliance gaps
- Generate audit reports
- Compare against industry benchmarks

**Typical Documents**: Process documentation, BPMN files, procedure manuals

---

### 🏗️ Solution Architect
**Best for**: Solution design, technology selection

Use the **Solution Fit-Gap** agent when you need to:
- Map requirements to platform capabilities
- Identify what works out-of-the-box
- Determine customization needs
- Estimate development effort
- Assess technical risk

**Typical Documents**: Requirements docs, platform capability lists, feature matrices

---

### ✅ Validation Lead
**Best for**: Test planning, quality assurance

Use the **Validation Traceability** agent when you need to:
- Generate test scenarios
- Create acceptance criteria
- Build traceability matrices
- Ensure requirement coverage
- Write Gherkin scenarios

**Typical Documents**: Requirements, user stories, existing test cases

## Using AI Agents

### Step-by-Step Workflow

#### 1. Upload Documents
- Click the upload zone or drag-and-drop files
- Supported formats: PDF, DOCX, TXT, CSV, XLSX
- Multiple files can be uploaded at once
- Max file size: 50MB per file

#### 2. Configure Analysis
Each agent has specific configuration options:

**IntellI-PM**:
- ✓ Risk Detection
- ✓ Action Tracking
- ✓ Schedule Analysis
- Priority Level: Low/Medium/High

**BA Process Intelligence**:
- Select compliance frameworks (GDPR, HIPAA, SOC2, ISO 27001)
- Choose industry (Healthcare, Finance, Tech, etc.)

**Other Agents**:
- Enable/disable advanced analysis
- Include examples in output

#### 3. Run Analysis
- Click "Run Analysis" button
- Wait for processing (typically 5-15 seconds)
- Status indicator shows progress
- ✓ Checkmark appears when complete

#### 4. Review Results
Results are organized in tabs/sections for easy navigation.

## Managing Documents

### Document Hub Features

**Upload**:
- Drag and drop or click to browse
- Multiple file upload supported
- Automatic format detection

**Search**:
- Search by filename
- Filter by type (PDF, DOCX, etc.)
- Filter by status (Processed, Processing, Pending)

**Actions**:
- Download original file
- Delete file
- Reuse in different agents

### Document Lifecycle

1. **Pending** - Just uploaded, not yet processed
2. **Processing** - Being analyzed by the system
3. **Processed** - Ready to use with agents

## Understanding Results

### IntellI-PM Results

**Project Health Summary**
- Overall project status narrative
- Key concerns highlighted

**Top Actions Table**
- Action item description
- Assigned owner
- Due date

**Risks Matrix**
- Risk description
- Impact level (High/Medium/Low) - color-coded
- Mitigation strategy

**Action Tracker**
- Action ID
- Current status (Open/Closed)
- Age in days

**Schedule Alerts**
- Milestone name
- Expected date
- Variance in days (red = delayed, green = ahead)

---

### BA Discovery Results

**Meeting Summary**
- Concise overview of discussions

**User Stories**
- "As a [role], I want [feature], so that [benefit]"
- Ready for backlog

**Requirements List**
- Numbered (R1, R2, etc.)
- Functional and non-functional

**Pain Points**
- Current process issues
- User complaints

**Gaps**
- Missing capabilities
- Impact assessment

**Follow-up Questions**
- Open items for next session

---

### BA Process Intelligence Results

**Risk Score**
- 0-100 scale (0 = best, 100 = worst)
- Visual gauge with color coding
- Green < 40, Yellow 40-70, Red > 70

**Compliance Checks**
- Framework rule ID
- Status: Pass ✓ / Fail ✗ / Partial ⚠
- Evidence from your documents

**Process Gaps**
- Missing controls
- Documentation issues

**Benchmark Comparison**
- Your maturity level
- Industry average

---

### Solution Fit-Gap Results

**Overall Fit Score**
- Percentage of requirements that can be met
- Higher is better

**Fit-Gap Matrix**
| Status | Meaning | Color | Effort |
|--------|---------|-------|--------|
| Fit | Works out-of-the-box | Green | 0 SP |
| Configuration | Settings change only | Blue | 1-3 SP |
| Customisation | Code changes needed | Orange | 5-13 SP |
| Gap | Not possible | Red | 13+ SP |

**Technical Risk**
- Low: Mostly fit/config
- Medium: Some customization
- High: Many gaps or complex custom work

**Architecture Recommendation**
- Strategic guidance on implementation approach

---

### Validation Traceability Results

**Coverage Score**
- Percentage of requirements with test cases
- Target: 85%+

**Test Scenarios**
- Test ID linked to Requirement ID
- Step-by-step instructions
- Expected result

**Traceability Matrix**
- Maps each requirement to test case(s)
- Ensures no orphan requirements

**Acceptance Criteria**
- Gherkin format: Given/When/Then
- Ready for Cucumber/BDD frameworks

## Exporting Your Work

### Export Formats

**PDF Reports**
- Best for: Presentations, executive summaries
- Includes: All analysis sections with formatting
- Available for: IntellI-PM, BA Process Intelligence

**CSV Files**
- Best for: Data manipulation, imports
- Includes: Tabular data only
- Available for: BA Discovery, Traceability

**Excel Matrices**
- Best for: Detailed analysis, sharing with stakeholders
- Includes: Multiple sheets with full data
- Available for: Fit-Gap, Traceability

### How to Export
1. Review your results
2. Click "Export Report" or "Export Matrix"
3. Choose format (if multiple options)
4. File downloads automatically

## Tips & Best Practices

### 📄 Document Preparation

✅ **DO**:
- Use clear, descriptive filenames
- Upload complete, finalized documents
- Include relevant context documents
- Group related documents in one analysis

❌ **DON'T**:
- Upload password-protected files
- Mix unrelated documents
- Upload duplicate versions
- Use extremely large files (>50MB)

### 🎯 Analysis Configuration

✅ **DO**:
- Select appropriate priority level
- Enable only needed features
- Choose correct industry/framework
- Review configuration before running

❌ **DON'T**:
- Use default settings blindly
- Enable everything "just in case"
- Skip framework selection for compliance

### 📊 Interpreting Results

✅ **DO**:
- Read the entire output
- Verify critical items manually
- Use results as a starting point
- Export for stakeholder review
- Combine results from multiple runs

❌ **DON'T**:
- Accept results without review
- Use as final deliverable without validation
- Ignore low-confidence items
- Share without context

### 🔄 Iterative Analysis

**Best Practice Workflow**:
1. Run initial analysis with all documents
2. Review results
3. Gather additional context if needed
4. Re-run with refined inputs
5. Compare versions
6. Export final version

### 🤝 Collaboration

**Sharing Results**:
- Export to PDF for read-only sharing
- Export to CSV/Excel for collaborative editing
- Include source documents for traceability
- Add your own notes and comments

## Keyboard Shortcuts

- `Tab` - Navigate between interactive elements
- `Enter` - Activate buttons and links
- `Esc` - Close modals (future feature)
- `Ctrl/Cmd + Click` - Open in new tab (links)

## Accessibility Features

This application is designed for all users:

- **Screen Reader Compatible**: All content is readable by NVDA, JAWS, VoiceOver
- **Keyboard Navigation**: Full functionality without a mouse
- **High Contrast**: WCAG AA compliant color ratios
- **Zoom Support**: Text remains readable at 200% zoom
- **Focus Indicators**: Clear blue outlines show keyboard focus

## Frequently Asked Questions

**Q: Can I upload multiple files at once?**  
A: Yes! You can select multiple files or drag-and-drop a batch.

**Q: What happens to my uploaded documents?**  
A: Currently, they are processed and stored temporarily. In production, they would be encrypted and auto-deleted per retention policy.

**Q: Can I switch roles mid-session?**  
A: Yes, click "Change Role" at any time. Your work is saved per role.

**Q: How accurate are the AI results?**  
A: Results are generated to accelerate your work, but should always be reviewed by a human expert before final use.

**Q: Can I edit the generated outputs?**  
A: Export to CSV/Excel format, then edit in your preferred tool.

**Q: Is my data secure?**  
A: Yes. This is an internal tool with enterprise-grade security. All data is encrypted in transit and at rest.

## Getting Help

If you encounter issues:

1. **Check this guide** - Most questions are answered here
2. **Try refreshing** - Clear cache and reload
3. **Contact support** - Email sdlc-support@yourcompany.com
4. **Report bugs** - Use the feedback form (future feature)

## Version History

**v1.0.0** (January 2026)
- Initial release
- 5 AI agents
- Document management
- Export functionality
- WCAG AA compliant

---

**Happy Accelerating!** 🚀

*This tool is designed to augment, not replace, your expertise. Always apply professional judgment to AI-generated outputs.*
