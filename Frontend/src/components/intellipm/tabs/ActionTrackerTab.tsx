import { useState, useMemo } from 'react';
import type { TopAction, ActionTracker } from '../../../types/intellipm';
import HealthBadge from '../HealthBadge';
import {
  ClipboardList,
  AlertCircle,
  Clock,
  CheckCircle,
  Download,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface Props {
  actions: TopAction[];
  tracker: ActionTracker;
}

type SortKey = 'action' | 'owner' | 'due_date' | 'status' | 'age_days' | 'priority';
type SortDir = 'asc' | 'desc';
const PRIORITY_ORDER: Record<string, number> = { High: 3, Medium: 2, Low: 1 };

function exportCSV(actions: TopAction[]) {
  const headers = ['Action', 'Owner', 'Due Date', 'Status', 'Age (days)', 'Priority'];
  const rows = actions.map((a) => [
    `"${a.action}"`,
    `"${a.owner}"`,
    a.due_date,
    a.status,
    a.age_days,
    a.priority,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'action_tracker.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export default function ActionTrackerTab({ actions: initialActions, tracker }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('priority');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterOwner, setFilterOwner] = useState('All');
  const [editedActions, setEditedActions] = useState<TopAction[]>(initialActions);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const owners = useMemo(
    () => ['All', ...Array.from(new Set(editedActions.map((a) => a.owner)))],
    [editedActions]
  );
  const statuses = useMemo(
    () => ['All', ...Array.from(new Set(editedActions.map((a) => a.status)))],
    [editedActions]
  );

  const sorted = useMemo(() => {
    return [...editedActions]
      .filter((a) => filterStatus === 'All' || a.status === filterStatus)
      .filter((a) => filterOwner === 'All' || a.owner === filterOwner)
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'priority') cmp = (PRIORITY_ORDER[a.priority] ?? 0) - (PRIORITY_ORDER[b.priority] ?? 0);
        else if (sortKey === 'age_days') cmp = a.age_days - b.age_days;
        else if (sortKey === 'due_date') cmp = a.due_date.localeCompare(b.due_date);
        else if (sortKey === 'owner') cmp = a.owner.localeCompare(b.owner);
        else if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
        else cmp = a.action.localeCompare(b.action);
        return sortDir === 'desc' ? -cmp : cmp;
      });
  }, [editedActions, sortKey, sortDir, filterStatus, filterOwner]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const saveEdit = (idx: number) => {
    setEditedActions(editedActions.map((a, i) => (i === idx ? { ...a, action: editValue } : a)));
    setEditIdx(null);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" aria-hidden="true" />;
    return sortDir === 'desc' ? <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" /> : <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />;
  };

  const thClass = 'px-3 py-3 text-left text-xs font-semibold text-brand-light/85 uppercase tracking-wider bg-brand-primary/20 hover:bg-brand-primary/35 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent transition-colors';

  return (
    <div className="space-y-5">
      {/* Stat Cards */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
        role="region"
        aria-label="Action tracker statistics"
      >
        {[
          {
            label: 'Total Actions',
            value: tracker.total_actions,
            icon: <ClipboardList className="w-5 h-5" aria-hidden="true" />,
            color: 'text-white',
            bg: 'bg-brand-dark/50 border-brand-primary/30 backdrop-blur-md',
            iconBg: 'bg-brand-primary/20 text-brand-light',
          },
          {
            label: 'Open Actions',
            value: tracker.open_actions,
            icon: <Clock className="w-5 h-5" aria-hidden="true" />,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10 border-blue-500/30 backdrop-blur-md',
            iconBg: 'bg-blue-500/20 text-blue-300',
          },
          {
            label: 'Overdue',
            value: tracker.overdue_actions,
            icon: <AlertCircle className="w-5 h-5" aria-hidden="true" />,
            color: tracker.overdue_actions > 0 ? 'text-red-400' : 'text-emerald-400',
            bg: tracker.overdue_actions > 0 ? 'bg-red-500/10 border-red-500/30 backdrop-blur-md' : 'bg-emerald-500/10 border-emerald-500/30 backdrop-blur-md',
            iconBg: tracker.overdue_actions > 0 ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300',
          },
          {
            label: 'Avg Age (days)',
            value: tracker.avg_age_open_days.toFixed(1),
            icon: <CheckCircle className="w-5 h-5" aria-hidden="true" />,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/30 backdrop-blur-md',
            iconBg: 'bg-amber-500/20 text-amber-300',
          },
        ].map(({ label, value, icon, color, bg, iconBg }) => (
          <div
            key={label}
            className={`rounded-xl border p-4 ${bg} shadow-sm`}
            aria-label={`${label}: ${value}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-brand-light/60 mt-0.5">{label}</p>
              </div>
              <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Owner Distribution */}
      <section
        aria-labelledby="owner-dist-heading"
        className="bg-brand-dark/50 rounded-xl border border-brand-primary/30 p-4 shadow-sm backdrop-blur-md"
      >
        <h3 id="owner-dist-heading" className="text-sm font-bold text-white mb-3">
          Actions by Owner
        </h3>
        <div className="space-y-2">
          {Object.entries(tracker.actions_by_owner)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([owner, count]) => {
              const maxCount = Math.max(...Object.values(tracker.actions_by_owner));
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={owner} className="flex items-center gap-3">
                  <span className="text-xs text-brand-light/75 w-28 truncate flex-shrink-0">{owner}</span>
                  <div
                    className="flex-1 h-2 bg-brand-primary/10 border border-brand-primary/20 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={count}
                    aria-valuemin={0}
                    aria-valuemax={maxCount}
                    aria-label={`${owner}: ${count} action${count !== 1 ? 's' : ''}`}
                  >
                    <div
                      className="h-full bg-brand-accent rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-brand-light w-6 text-right flex-shrink-0">
                    {count}
                  </span>
                </div>
              );
            })}
        </div>
      </section>

      {/* Filters + Export */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center" role="group" aria-label="Action filters">
          <div>
            <label htmlFor="filter-status" className="text-xs font-semibold text-brand-light/80 mr-1.5">
              Status:
            </label>
            <select
              id="filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs rounded-md bg-brand-primary/10 border border-brand-primary/30 text-brand-light px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              {statuses.map((s) => (
                <option key={s} value={s} className="bg-brand-dark text-brand-light">{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-owner" className="text-xs font-semibold text-brand-light/80 mr-1.5">
              Owner:
            </label>
            <select
              id="filter-owner"
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className="text-xs rounded-md bg-brand-primary/10 border border-brand-primary/30 text-brand-light px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              {owners.map((o) => (
                <option key={o} value={o} className="bg-brand-dark text-brand-light">{o}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-brand-light/60">
            Showing {sorted.length} of {editedActions.length} actions
          </p>
        </div>
        <button
          onClick={() => exportCSV(editedActions)}
          className="flex items-center gap-2 text-xs bg-brand-accent hover:bg-brand-accent/80 text-brand-dark px-3 py-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent transition-colors font-semibold shadow-sm cursor-pointer"
          aria-label="Export action tracker as CSV file"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-brand-primary/30 shadow-md bg-brand-dark/50 backdrop-blur-md">
        <table className="w-full text-sm" role="grid" aria-label="Action tracker table">
          <caption className="sr-only">
            Action tracker with sortable columns. Click column headers to sort.
          </caption>
          <thead>
            <tr>
              <th scope="col" className={thClass} onClick={() => handleSort('action')}
                aria-sort={sortKey === 'action' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleSort('action')}>
                <span className="flex items-center gap-1">Action <SortIcon col="action" /></span>
              </th>
              <th scope="col" className={thClass} onClick={() => handleSort('owner')}
                aria-sort={sortKey === 'owner' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleSort('owner')}>
                <span className="flex items-center gap-1">Owner <SortIcon col="owner" /></span>
              </th>
              <th scope="col" className={thClass} onClick={() => handleSort('due_date')}
                aria-sort={sortKey === 'due_date' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleSort('due_date')}>
                <span className="flex items-center gap-1">Due Date <SortIcon col="due_date" /></span>
              </th>
              <th scope="col" className={thClass} onClick={() => handleSort('status')}
                aria-sort={sortKey === 'status' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleSort('status')}>
                <span className="flex items-center gap-1">Status <SortIcon col="status" /></span>
              </th>
              <th scope="col" className={thClass} onClick={() => handleSort('age_days')}
                aria-sort={sortKey === 'age_days' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleSort('age_days')}>
                <span className="flex items-center gap-1">Age (d) <SortIcon col="age_days" /></span>
              </th>
              <th scope="col" className={thClass} onClick={() => handleSort('priority')}
                aria-sort={sortKey === 'priority' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleSort('priority')}>
                <span className="flex items-center gap-1">Priority <SortIcon col="priority" /></span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-primary/20 bg-transparent">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-brand-light/60">
                  No actions match the current filters.
                </td>
              </tr>
            ) : (
              sorted.map((action, i) => {
                const globalIdx = editedActions.indexOf(action);
                const isEditing = editIdx === globalIdx;
                const isOverdue = action.status === 'Overdue';
                return (
                  <tr
                    key={i}
                    className={`hover:bg-brand-primary/10 transition-colors ${isOverdue ? 'bg-red-500/5' : ''}`}
                    aria-label={isOverdue ? `Overdue action: ${action.action}` : undefined}
                  >
                    <td className="px-3 py-3 font-medium text-white max-w-xs">
                      {isEditing ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="text-xs bg-brand-dark border border-brand-accent/50 rounded px-2 py-1 w-full text-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
                            aria-label="Edit action description"
                            autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(globalIdx); if (e.key === 'Escape') setEditIdx(null); }}
                          />
                          <button onClick={() => saveEdit(globalIdx)} className="text-xs bg-brand-accent text-brand-dark font-semibold px-2 py-1 rounded whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent cursor-pointer">Save</button>
                          <button onClick={() => setEditIdx(null)} className="text-xs bg-brand-primary/30 text-brand-light px-2 py-1 rounded whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent cursor-pointer">Cancel</button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 group">
                            {isOverdue && <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-500" aria-hidden="true" />}
                            <span className="text-xs leading-relaxed">{action.action}</span>
                            <button
                              onClick={() => { setEditIdx(globalIdx); setEditValue(action.action); }}
                              className="flex-shrink-0 text-xs text-brand-accent opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-brand-accent/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded transition-opacity cursor-pointer"
                              aria-label={`Edit action: ${action.action}`}
                            >Edit</button>
                          </div>
                          {action.source_file && action.source_file !== 'NA' && (
                            <div>
                              <span className="text-[10px] bg-brand-primary/45 text-brand-accent px-1.5 py-0.5 rounded font-mono border border-brand-primary/30">
                                Source: {action.source_file}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-brand-light/90 whitespace-nowrap text-xs">{action.owner}</td>
                    <td className="px-3 py-3 text-brand-light/90 whitespace-nowrap text-xs font-mono">{action.due_date}</td>
                    <td className="px-3 py-3"><HealthBadge status={action.status} size="sm" /></td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-semibold ${action.age_days >= 10 ? 'text-red-400' : action.age_days >= 5 ? 'text-amber-400' : 'text-brand-light/90'}`}>
                        {action.age_days}d
                      </span>
                    </td>
                    <td className="px-3 py-3"><HealthBadge status={action.priority} size="sm" /></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
