import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Persona } from '../types';
import { personaInfo } from '../data/agents';
import {
  Upload, FileText, Home, LogOut, Search, Trash2,
  Download, Calendar, File
} from 'lucide-react';

interface DocumentHubProps {
  persona: Persona;
  onChangePersona: (persona: Persona | null) => void;
}

interface MockDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  status: 'processed' | 'processing' | 'pending';
}

export default function DocumentHub({ persona, onChangePersona }: DocumentHubProps) {
  const navigate = useNavigate();
  const info = personaInfo[persona];
  const [searchQuery, setSearchQuery] = useState('');

  const mockDocuments: MockDocument[] = [
    { id: '1', name: 'Project_Requirements_v2.pdf', type: 'PDF', size: '2.4 MB', uploadedAt: '2026-01-15', status: 'processed' },
    { id: '2', name: 'User_Stories_Sprint5.docx', type: 'DOCX', size: '156 KB', uploadedAt: '2026-01-14', status: 'processed' },
    { id: '3', name: 'Process_Documentation.pdf', type: 'PDF', size: '5.1 MB', uploadedAt: '2026-01-13', status: 'processed' },
    { id: '4', name: 'Meeting_Notes_Jan10.txt', type: 'TXT', size: '12 KB', uploadedAt: '2026-01-10', status: 'processed' },
    { id: '5', name: 'Capability_Matrix.xlsx', type: 'XLSX', size: '847 KB', uploadedAt: '2026-01-09', status: 'processing' },
  ];

  const filteredDocuments = mockDocuments.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Document Hub</h1>
                <p className="text-sm text-slate-600">{info.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => {
                  onChangePersona(null);
                  navigate('/');
                }}
                className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Upload Section */}
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-8 mb-8">
          <div className="text-center">
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload Documents</h3>
            <p className="text-slate-600 mb-4">
              Drag and drop files here, or click to browse
            </p>
            <label className="inline-block">
              <input
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.docx,.txt,.csv,.xlsx"
              />
              <span className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                <Upload className="w-5 h-5" />
                Choose Files
              </span>
            </label>
            <p className="text-xs text-slate-500 mt-3">
              Supported formats: PDF, DOCX, TXT, CSV, XLSX (Max 50MB per file)
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select className="px-4 py-2 border border-slate-300 rounded-lg text-sm">
              <option>All Types</option>
              <option>PDF</option>
              <option>DOCX</option>
              <option>TXT</option>
              <option>CSV/XLSX</option>
            </select>
            <select className="px-4 py-2 border border-slate-300 rounded-lg text-sm">
              <option>All Status</option>
              <option>Processed</option>
              <option>Processing</option>
              <option>Pending</option>
            </select>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">
              Your Documents ({filteredDocuments.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-200">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <File className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 truncate">{doc.name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                      <span>{doc.type}</span>
                      <span>•</span>
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {doc.uploadedAt}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${doc.status === 'processed' ? 'bg-emerald-100 text-emerald-800' :
                        doc.status === 'processing' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-800'
                      }`}>
                      {doc.status}
                    </span>
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{mockDocuments.length}</div>
                <div className="text-sm text-slate-600">Total Documents</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {mockDocuments.filter(d => d.status === 'processed').length}
                </div>
                <div className="text-sm text-slate-600">Processed</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">8.5 MB</div>
                <div className="text-sm text-slate-600">Total Size</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
