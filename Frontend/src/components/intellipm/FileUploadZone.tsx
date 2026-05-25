import { useRef, useState, useCallback } from 'react';
import {
  Upload,
  File,
  FileText,
  Sheet,
  Image as ImageIcon,
  Mic,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import type { UploadedFile } from '../../types/intellipm';

const ACCEPTED_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/json': ['.json'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/bmp': ['.bmp'],
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/x-m4a': ['.m4a'],
  'audio/ogg': ['.ogg'],
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" aria-hidden="true" />;
  if (type.startsWith('audio/')) return <Mic className="w-4 h-4" aria-hidden="true" />;
  if (type.includes('sheet') || type.includes('csv') || type.includes('excel'))
    return <Sheet className="w-4 h-4" aria-hidden="true" />;
  if (type.includes('pdf') || type.includes('word') || type.includes('text'))
    return <FileText className="w-4 h-4" aria-hidden="true" />;
  return <File className="w-4 h-4" aria-hidden="true" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
}

export default function FileUploadZone({ files, onChange }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const currentTotal = files.reduce((sum, f) => sum + f.size, 0);
      const newFiles: UploadedFile[] = [];

      Array.from(fileList).forEach((file) => {
        if (file.size > MAX_FILE_SIZE) {
          newFiles.push({
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            type: file.type,
            status: 'error',
            errorMessage: `File exceeds 20 MB limit`,
          });
          return;
        }
        if (currentTotal + file.size > MAX_TOTAL_SIZE) {
          newFiles.push({
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            type: file.type,
            status: 'error',
            errorMessage: `Total upload limit (50 MB) exceeded`,
          });
          return;
        }

        // Check if already uploaded
        const exists = files.some((f) => f.name === file.name && f.size === file.size);
        if (!exists) {
          newFiles.push({
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            type: file.type,
            status: 'ready',
          });
        }
      });

      onChange([...files, ...newFiles]);
    },
    [files, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeFile = (id: string) => {
    onChange(files.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload files. Drag and drop or click to browse. Supported formats: PDF, DOCX, TXT, CSV, XLSX, JSON, PNG, JPG, MP3, WAV, M4A, OGG."
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark
          ${isDragging
            ? 'border-brand-accent bg-brand-accent/10 scale-[1.01]'
            : 'border-brand-primary/30 bg-brand-primary/5 hover:border-brand-accent hover:bg-brand-primary/10'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          accept={Object.keys(ACCEPTED_TYPES).join(',')}
          onChange={(e) => processFiles(e.target.files)}
          aria-hidden="true"
          tabIndex={-1}
        />
        <div className="flex flex-col items-center gap-3">
          <div
            className={`p-3 rounded-full transition-colors ${
              isDragging ? 'bg-brand-accent/20' : 'bg-brand-primary/20'
            }`}
            aria-hidden="true"
          >
            <Upload
              className={`w-6 h-6 ${isDragging ? 'text-brand-accent' : 'text-brand-light/50'}`}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-light">
              {isDragging ? 'Drop files here' : 'Drag & drop files, or click to browse'}
            </p>
            <p className="text-xs text-brand-light/60 mt-1">
              PDF, DOCX, TXT, CSV, XLSX, JSON, PNG, JPG, MP3, WAV, M4A, OGG
            </p>
            <p className="text-xs text-brand-light/40 mt-0.5">
              Max 20 MB per file · Max 50 MB total
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <ul
          className="space-y-2"
          aria-label={`Uploaded files: ${files.length} file${files.length !== 1 ? 's' : ''}`}
        >
          {files.map((file) => (
            <li
              key={file.id}
              className={`flex items-center gap-3 p-3 rounded-lg border text-sm transition-colors ${
                file.status === 'error'
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-brand-primary/10 border-brand-primary/30'
              }`}
            >
              <span
                className={`flex-shrink-0 ${
                  file.status === 'error' ? 'text-red-400' : 'text-brand-light/50'
                }`}
              >
                {getFileIcon(file.type)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-brand-light truncate">{file.name}</p>
                <p className="text-xs text-brand-light/50">
                  {formatSize(file.size)}
                  {file.errorMessage && (
                    <span className="text-red-600 ml-2">· {file.errorMessage}</span>
                  )}
                </p>
              </div>
              {file.status === 'ready' && (
                <CheckCircle
                  className="w-4 h-4 text-emerald-500 flex-shrink-0"
                  aria-label="File ready"
                />
              )}
              {file.status === 'error' && (
                <AlertCircle
                  className="w-4 h-4 text-red-500 flex-shrink-0"
                  aria-label="File error"
                />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.id);
                }}
                className="flex-shrink-0 p-1 rounded hover:bg-brand-primary/30 text-brand-light/50 hover:text-brand-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent transition-colors"
                aria-label={`Remove ${file.name}`}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
