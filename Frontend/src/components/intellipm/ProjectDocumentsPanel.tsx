import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Calendar, FileDown } from 'lucide-react';

interface ProjectDocumentsPanelProps {
  projectName: string;
}

interface ProjectFile {
  name: string;
  path: string;
  last_modified: number;
}

export default function ProjectDocumentsPanel({ projectName }: ProjectDocumentsPanelProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [lastVectorized, setLastVectorized] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch file list and synchronization metadata
  const fetchProjectFiles = async () => {
    if (!projectName) return;
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/projects/${encodeURIComponent(projectName)}/files`);
      if (!response.ok) throw new Error('Failed to retrieve project files');
      const data = await response.json();
      setFiles(data.files || []);
      setLastVectorized(data.last_vectorized || null);
    } catch (error) {
      console.error('Error fetching project documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectFiles();
    setUploadStatus(null);
  }, [projectName]);

  // Handle document upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadStatus(null);

    const file = selectedFiles[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(
        `http://localhost:8000/api/projects/${encodeURIComponent(projectName)}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data = await response.json();
      setFiles(data.files || []);
      setLastVectorized(data.last_vectorized || null);
      setUploadStatus({
        type: 'success',
        message: `File "${file.name}" uploaded and indexed successfully.`,
      });

      // Clear input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadStatus({
        type: 'error',
        message: error.message || 'An error occurred during upload.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Format Unix epoch timestamp
  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="flex flex-col h-full gap-5 text-white">
      {/* Title Header */}
      <div>
        <h3 className="text-lg font-bold text-white tracking-tight">Project Documents</h3>
        <p className="text-xs text-brand-light/60 mt-1 font-mono uppercase tracking-wider">
          Focus: {projectName}
        </p>
      </div>

      {/* Sync Status Feedback */}
      <div className="p-3.5 rounded-xl bg-brand-primary/10 border border-brand-primary/20 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
          <span className="text-xs font-semibold text-brand-light">Database Index Status</span>
        </div>
        <p className="text-xs text-brand-light/70 mt-2 font-medium">
          Last Chunked & Vectorized:
        </p>
        <p className="text-sm font-semibold text-brand-accent mt-0.5 font-mono">
          {formatTimestamp(lastVectorized)}
        </p>
      </div>

      {/* File Upload Zone */}
      <div className="relative">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          disabled={isUploading}
          className="hidden"
          accept=".pdf,.docx,.txt,.csv,.xlsx,.pptx"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={`
            w-full border-2 border-dashed border-brand-primary/30 rounded-xl p-5
            flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200
            bg-brand-primary/5 hover:bg-brand-primary/10 hover:border-brand-accent/40
            ${isUploading ? 'opacity-50 cursor-not-allowed border-brand-primary/20' : ''}
          `}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-6 h-6 text-brand-accent animate-spin" />
              <span className="text-xs font-semibold text-brand-light">Vectorizing & storing...</span>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6 text-brand-accent" />
              <span className="text-xs font-semibold text-brand-light">Upload Project Document</span>
              <span className="text-[10px] text-brand-light/50">PDF, DOCX, CSV, XLSX, PPTX, TXT</span>
            </>
          )}
        </button>
      </div>

      {/* Success/Error Banners */}
      {uploadStatus && (
        <div
          className={`flex items-start gap-2.5 p-3 rounded-xl text-xs font-medium border leading-normal animate-fade-in ${
            uploadStatus.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}
          role="alert"
        >
          {uploadStatus.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <span className="flex-1">{uploadStatus.message}</span>
        </div>
      )}

      {/* File List Inventory */}
      <div className="flex-1 flex flex-col min-h-[220px]">
        <div className="flex items-center justify-between border-b border-brand-primary/20 pb-2 mb-2">
          <span className="text-xs font-bold text-brand-light/70 uppercase tracking-wider">
            Indexed Files ({files.length})
          </span>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[350px] pr-1 space-y-2 scrollbar-hide">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 gap-2">
              <Loader2 className="w-4 h-4 text-brand-accent animate-spin" />
              <span className="text-xs text-brand-light/60 font-medium">Fetching file database...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-brand-primary/5 rounded-xl border border-brand-primary/20 border-dashed">
              <FileText className="w-8 h-8 text-brand-light/30 mb-2" />
              <p className="text-xs text-brand-light/60 font-medium">No documents vectorized yet.</p>
              <p className="text-[10px] text-brand-light/40 mt-1 max-w-[180px]">Upload project notes or spreadsheets to enable RAG query.</p>
            </div>
          ) : (
            files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-brand-primary/10 border border-brand-primary/20 hover:border-brand-primary/40 rounded-xl transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-brand-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-brand-light truncate group-hover:text-brand-accent transition-colors" title={file.name}>
                    {file.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-brand-light/50">
                    <Calendar className="w-3 h-3" />
                    <span>{formatTimestamp(file.last_modified)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
