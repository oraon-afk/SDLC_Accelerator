import { useState } from 'react';
import type { AnalysisModules, PriorityLevel, TimeHorizon, UploadedFile } from '../../types/intellipm';
import FileUploadZone from './FileUploadZone';
import AnalysisConfig from './AnalysisConfig';
import {
  Brain,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
  Info,
  Activity,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  onAnalysisStart: (config: {
    modules: AnalysisModules;
    priority: PriorityLevel;
    timeHorizon: TimeHorizon;
    files: UploadedFile[];
    notes: string;
  }) => void;
  isProcessing: boolean;
  processingStep: string;
}

const DEFAULT_MODULES: AnalysisModules = {
  riskDetection: true,
  actionTracking: true,
  scheduleAnalysis: true,
  escalationPrediction: true,
};

export default function IntelliPMWorkspace({ onAnalysisStart, isProcessing, processingStep }: Props) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [notes, setNotes] = useState('');
  const [modules, setModules] = useState<AnalysisModules>(DEFAULT_MODULES);
  const [priority, setPriority] = useState<PriorityLevel>('Medium');
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('1 month');
  const [showConfig, setShowConfig] = useState(true);

  const atLeastOneEnabled = Object.values(modules).some(Boolean);
  const hasInput = files.some((f) => f.status === 'ready') || notes.trim().length > 0;
  const canRun = hasInput && atLeastOneEnabled && !isProcessing;

  const handleRun = () => {
    if (!canRun) return;
    onAnalysisStart({ modules, priority, timeHorizon, files, notes });
  };

  const notesCharsLeft = 10000 - notes.length;

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div
        className="flex items-start gap-3 p-4 rounded-xl bg-brand-primary/10 border border-brand-primary/30"
        role="note"
        aria-label="How IntellI-PM works"
      >
        <Info className="w-5 h-5 text-brand-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm text-brand-light/80">
          <p className="font-semibold text-brand-light mb-0.5">How IntellI‑PM works</p>
          <p className="text-xs leading-relaxed">
            Upload your project artifacts (PDFs, spreadsheets, meeting notes, images, audio) or paste raw text below.
            Select the analysis modules you need, configure the priority, then click{' '}
            <strong className="text-brand-light">Run Analysis</strong>. The agent will synthesise all inputs and produce a structured health report.
          </p>
        </div>
      </div>

      {/* Pre-computation Insights / Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-brand-primary/30 bg-brand-primary/10 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-brand-accent" />
            <h3 className="font-bold text-brand-light">Current Project Progress</h3>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1 text-brand-light/70">
              <span>Sprint 4 Delivery</span>
              <span className="font-medium text-brand-light">75%</span>
            </div>
            <div className="w-full bg-brand-primary/30 rounded-full h-2">
              <div className="bg-brand-accent h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
          <p className="text-xs text-brand-light/50 mt-3">Based on latest workspace sync (2 hours ago)</p>
        </div>

        <div className="p-4 rounded-xl border border-brand-primary/30 bg-brand-primary/10 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-brand-light">Detected Risk Factors</h3>
          </div>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-brand-light/70">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(248,113,113,0.6)]"></span>
              <span>Potential schedule slippage due to blocked API integration dependencies.</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-brand-light/70">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
              <span>Resource bandwidth constraints identified in automotive compliance tracks.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* File Upload */}
      <section aria-labelledby="upload-section-heading">
        <div className="flex items-center gap-2 mb-3">
          <h2
            id="upload-section-heading"
            className="text-sm font-bold text-brand-light"
          >
            1. Upload Project Artifacts
          </h2>
          <span className="text-xs text-brand-light/60 font-normal">
            (PDF, DOCX, CSV, XLSX, JSON, Images, Audio)
          </span>
        </div>
        <FileUploadZone files={files} onChange={setFiles} />
      </section>

      {/* Direct Notes */}
      <section aria-labelledby="notes-section-heading">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-brand-light/60" aria-hidden="true" />
          <h2
            id="notes-section-heading"
            className="text-sm font-bold text-brand-light"
          >
            2. Direct Notes / Paste Text
          </h2>
          <span className="text-xs text-brand-light/60">(optional – alternative or supplement to file upload)</span>
        </div>
        <div className="relative">
          <textarea
            id="direct-notes"
            value={notes}
            onChange={(e) => {
              if (e.target.value.length <= 10000) setNotes(e.target.value);
            }}
            placeholder="Paste meeting notes, status updates, or any raw project text here…"
            rows={6}
            maxLength={10000}
            aria-label="Direct notes input. Maximum 10,000 characters."
            aria-describedby="notes-char-count"
            className="w-full rounded-xl border border-brand-primary/30 bg-brand-primary/10 px-4 py-3 text-sm text-brand-light placeholder-brand-light/40 resize-y focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition-colors"
          />
          <p
            id="notes-char-count"
            className={`absolute bottom-2 right-3 text-xs ${
              notesCharsLeft < 500 ? 'text-red-400' : 'text-brand-light/40'
            }`}
            aria-live="polite"
            aria-atomic="true"
          >
            {notesCharsLeft.toLocaleString()} characters remaining
          </p>
        </div>
      </section>

      {/* Analysis Configuration */}
      <section aria-labelledby="config-section-heading">
        <button
          id="config-section-toggle"
          onClick={() => setShowConfig((v) => !v)}
          className="flex items-center gap-2 w-full text-left mb-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded"
          aria-expanded={showConfig}
          aria-controls="config-section-content"
        >
          <h2
            id="config-section-heading"
            className="text-sm font-bold text-brand-light"
          >
            3. Analysis Configuration
          </h2>
          {showConfig ? (
            <ChevronUp className="w-4 h-4 text-brand-light/50 group-hover:text-brand-light transition-colors" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4 text-brand-light/50 group-hover:text-brand-light transition-colors" aria-hidden="true" />
          )}
        </button>

        <div
          id="config-section-content"
          aria-labelledby="config-section-heading"
          hidden={!showConfig}
          className={showConfig ? 'block' : 'hidden'}
        >
          <div className="bg-brand-primary/5 rounded-xl border border-brand-primary/30 p-4 shadow-sm">
            <AnalysisConfig
              modules={modules}
              priority={priority}
              timeHorizon={timeHorizon}
              onModulesChange={setModules}
              onPriorityChange={setPriority}
              onTimeHorizonChange={setTimeHorizon}
            />
          </div>
        </div>
      </section>

      {/* Validation Messages */}
      {!hasInput && (
        <p role="alert" className="text-xs text-brand-light/60 flex items-center gap-1.5">
          <span aria-hidden="true">ℹ️</span>
          Please upload at least one artifact or enter text in the notes area to proceed.
        </p>
      )}

      {/* Run Button */}
      <div className="flex flex-col items-stretch gap-3 pt-2">
        <button
          onClick={handleRun}
          disabled={!canRun}
          className={`
            relative flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-base
            transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark
            ${canRun
              ? 'bg-gradient-to-r from-brand-primary to-brand-accent hover:from-brand-accent hover:to-brand-primary text-brand-dark shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 hover:-translate-y-0.5'
              : 'bg-brand-primary/20 text-brand-light/30 cursor-not-allowed border border-brand-primary/30'
            }
          `}
          aria-label={
            isProcessing
              ? `Analysis in progress: ${processingStep}`
              : canRun
              ? 'Run analysis on uploaded artifacts and configuration'
              : 'Run Analysis (disabled – upload files or enter notes first)'
          }
          aria-busy={isProcessing}
          aria-disabled={!canRun}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              <span>{processingStep}</span>
            </>
          ) : (
            <>
              <Brain className="w-5 h-5" aria-hidden="true" />
              <span>Run Analysis</span>
            </>
          )}
        </button>

        {isProcessing && (
          <div
            className="w-full h-1.5 bg-brand-primary/20 rounded-full overflow-hidden"
            role="progressbar"
            aria-label="Analysis progress"
            aria-valuetext={processingStep}
          >
            <div className="h-full bg-gradient-to-r from-brand-primary to-brand-accent rounded-full animate-pulse" style={{ width: '70%' }} />
          </div>
        )}
      </div>
    </div>
  );
}
