import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { LEAD_STATUSES, LEAD_SOURCES, PRIORITIES } from '../../utils/crmConstants';

export default function LeadFilters({ filters, onChange, counselors = [], onApply, onClear }) {
  const [showFilters, setShowFilters] = useState(false);

  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search name, phone, email, lead ID..."
            value={filters.search || ''}
            onChange={(e) => update('search', e.target.value)}
          />
        </div>
        <button className="btn-secondary" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4" /> Filters
        </button>
        <button className="btn-primary" onClick={onApply}>Apply</button>
        <button className="btn-secondary" onClick={onClear}><X className="h-4 w-4" /> Clear</button>
      </div>

      {showFilters && (
        <div className="card grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label">Status</label>
            <select className="input" value={filters.status || ''} onChange={(e) => update('status', e.target.value)}>
              <option value="">All</option>
              {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={filters.priority || ''} onChange={(e) => update('priority', e.target.value)}>
              <option value="">All</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Lead Source</label>
            <select className="input" value={filters.leadSource || ''} onChange={(e) => update('leadSource', e.target.value)}>
              <option value="">All</option>
              {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Counselor</label>
            <select className="input" value={filters.counselorId || ''} onChange={(e) => update('counselorId', e.target.value)}>
              <option value="">All</option>
              {counselors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Course</label>
            <input className="input" value={filters.course || ''} onChange={(e) => update('course', e.target.value)} />
          </div>
          <div>
            <label className="label">University</label>
            <input className="input" value={filters.university || ''} onChange={(e) => update('university', e.target.value)} />
          </div>
          <div>
            <label className="label">City</label>
            <input className="input" value={filters.city || ''} onChange={(e) => update('city', e.target.value)} />
          </div>
          <div>
            <label className="label">Created From</label>
            <input type="date" className="input" value={filters.createdFrom || ''} onChange={(e) => update('createdFrom', e.target.value)} />
          </div>
        </div>
      )}
    </div>
  );
}
