import { useState, useMemo } from 'react';
import type { Risk, ImpactLevel } from '../../../types/intellipm';
import HealthBadge from '../HealthBadge';
import { ShieldAlert, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  risks: Risk[];
}

type SortKey = 'impact' | 'probability' | 'owner' | 'status';
type SortDir = 'asc' | 'desc';

const IMPACT_ORDER: Record<ImpactLevel, number> = { High: 3, Medium: 2, Low: 1 };

export default function RisksTab({ risks: initialRisks }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('impact');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterImpact, setFilterImpact] = useState<string>('All');
  const [filterProb, setFilterProb] = useState<string>('All');
  const [editedRisks, setEditedRisks] = useState<Risk[]>(initialRisks);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const sorted = useMemo(() => {
    return [...editedRisks]
      .filter((r) => filterImpact === 'All' || r.impact === filterImpact)
      .filter((r) => filterProb === 'All' || r.probability === filterProb)
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'impact') cmp = IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact];
        else if (sortKey === 'probability')
          cmp = IMPACT_ORDER[a.probability] - IMPACT_ORDER[b.probability];
        else if (sortKey === 'owner') cmp = a.owner.localeCompare(b.owner);
        else if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
        return sortDir === 'desc' ? -cmp : cmp;
      });
  }, [editedRisks, sortKey, sortDir, filterImpact, filterProb]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const startEdit = (globalIdx: number, currentMitigation: string) => {
    setEditingIdx(globalIdx);
    setEditValue(currentMitigation);
  };

  const saveEdit = (globalIdx: number) => {
    const updated = editedRisks.map((r, i) =>
      i === globalIdx ? { ...r, mitigation: editValue } : r
    );
    setEditedRisks(updated);
    setEditingIdx(null);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" aria-hidden="true" />;
    return sortDir === 'desc' ? (
      <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
    ) : (
      <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
    );
  };

  const thClass =
    'px-4 py-3 text-left text-xs font-semibold text-brand-light/85 uppercase tracking-wider bg-brand-primary/20 hover:bg-brand-primary/35 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent transition-colors';

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3" role="region" aria-label="Risk summary">
        {(['High', 'Medium', 'Low'] as ImpactLevel[]).map((level) => {
          const count = editedRisks.filter((r) => r.impact === level).length;
          return (
            <div
              key={level}
              className="bg-brand-dark/50 rounded-xl border border-brand-primary/30 p-3 text-center shadow-sm backdrop-blur-md"
              aria-label={`${level} impact: ${count} risk${count !== 1 ? 's' : ''}`}
            >
              <p
                className={`text-2xl font-bold ${
                  level === 'High'
                    ? 'text-red-400'
                    : level === 'Medium'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {count}
              </p>
              <p className="text-xs text-brand-light/60 mt-0.5">{level} Impact</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div
        className="flex flex-wrap gap-3 items-center"
        role="group"
        aria-label="Risk filters"
      >
        <div>
          <label htmlFor="filter-impact" className="text-xs font-semibold text-brand-light/80 mr-1.5">
            Impact:
          </label>
          <select
            id="filter-impact"
            value={filterImpact}
            onChange={(e) => setFilterImpact(e.target.value)}
            className="text-xs rounded-md bg-brand-primary/10 border border-brand-primary/30 text-brand-light px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          >
            {['All', 'High', 'Medium', 'Low'].map((v) => (
              <option key={v} value={v} className="bg-brand-dark text-brand-light">{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-prob" className="text-xs font-semibold text-brand-light/80 mr-1.5">
            Probability:
          </label>
          <select
            id="filter-prob"
            value={filterProb}
            onChange={(e) => setFilterProb(e.target.value)}
            className="text-xs rounded-md bg-brand-primary/10 border border-brand-primary/30 text-brand-light px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          >
            {['All', 'High', 'Medium', 'Low'].map((v) => (
              <option key={v} value={v} className="bg-brand-dark text-brand-light">{v}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-brand-light/60 ml-auto">
          Showing {sorted.length} of {editedRisks.length} risks
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-brand-primary/30 shadow-md backdrop-blur-md bg-brand-dark/50">
        <table className="w-full text-sm" role="grid" aria-label="Risk register">
          <caption className="sr-only">
            Risk register with sortable columns. Click column headers to sort.
          </caption>
          <thead>
            <tr>
              <th scope="col" className={`${thClass} w-8`}>
                <ShieldAlert className="w-4 h-4 text-red-400" aria-hidden="true" />
              </th>
              <th scope="col" className={`${thClass} max-w-xs`}>Risk</th>
              <th
                scope="col"
                className={thClass}
                onClick={() => handleSort('impact')}
                aria-sort={sortKey === 'impact' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSort('impact')}
              >
                <span className="flex items-center gap-1">Impact <SortIcon col="impact" /></span>
              </th>
              <th
                scope="col"
                className={thClass}
                onClick={() => handleSort('probability')}
                aria-sort={sortKey === 'probability' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSort('probability')}
              >
                <span className="flex items-center gap-1">Probability <SortIcon col="probability" /></span>
              </th>
              <th
                scope="col"
                className={thClass}
                onClick={() => handleSort('owner')}
                aria-sort={sortKey === 'owner' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSort('owner')}
              >
                <span className="flex items-center gap-1">Owner <SortIcon col="owner" /></span>
              </th>
              <th
                scope="col"
                className={thClass}
                onClick={() => handleSort('status')}
                aria-sort={sortKey === 'status' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSort('status')}
              >
                <span className="flex items-center gap-1">Status <SortIcon col="status" /></span>
              </th>
              <th scope="col" className={thClass}>Mitigation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-primary/20 bg-transparent">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-brand-light/60">
                  No risks match the current filters.
                </td>
              </tr>
            ) : (
              sorted.map((risk) => {
                const globalIdx = editedRisks.indexOf(risk);
                const isEditing = editingIdx === globalIdx;
                return (
                  <tr
                    key={globalIdx}
                    className="hover:bg-brand-primary/10 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full ${
                          risk.impact === 'High'
                            ? 'bg-red-500'
                            : risk.impact === 'Medium'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        aria-hidden="true"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-white max-w-xs">
                      <div>{risk.risk}</div>
                      {risk.source_file && risk.source_file !== 'NA' && (
                        <div className="mt-1">
                          <span className="text-[10px] bg-brand-primary/45 text-brand-accent px-1.5 py-0.5 rounded font-mono border border-brand-primary/30">
                            Source: {risk.source_file}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <HealthBadge status={risk.impact} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <HealthBadge status={risk.probability} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-brand-light/90 whitespace-nowrap">{risk.owner}</td>
                    <td className="px-4 py-3">
                      <HealthBadge status={risk.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-brand-light/80 max-w-xs">
                      {isEditing ? (
                        <div className="flex gap-2 items-center">
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="text-xs bg-brand-dark border border-brand-accent/50 rounded p-1 w-full text-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
                            rows={2}
                            aria-label="Edit mitigation text"
                            autoFocus
                          />
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <button
                              onClick={() => saveEdit(globalIdx)}
                              className="text-xs bg-brand-accent text-brand-dark font-semibold px-2 py-0.5 rounded hover:bg-brand-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                              aria-label="Save mitigation edit"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingIdx(null)}
                              className="text-xs bg-brand-primary/30 text-brand-light px-2 py-0.5 rounded hover:bg-brand-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                              aria-label="Cancel mitigation edit"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-start gap-2 group">
                            <span className="text-xs leading-relaxed"><strong className="text-brand-light font-medium">Mitigation: </strong>{risk.mitigation}</span>
                            <button
                              onClick={() => startEdit(globalIdx, risk.mitigation)}
                              className="flex-shrink-0 text-xs text-brand-accent opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-brand-accent/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded transition-opacity"
                              aria-label={`Edit mitigation for: ${risk.risk}`}
                            >
                              Edit
                            </button>
                          </div>
                          {risk.suggested_action && risk.suggested_action !== 'NA' && (
                            <div className="text-[11px] leading-relaxed text-brand-accent bg-brand-primary/10 border border-brand-primary/20 rounded-md p-2 mt-1.5 font-sans">
                              <span className="font-bold text-white">Suggested Action: </span>
                              {risk.suggested_action}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
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
