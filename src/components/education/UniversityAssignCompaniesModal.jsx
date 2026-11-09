import { useEffect, useState } from 'react';
import { Search, Building2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import { universityCompanyService } from '../../services/educationService';

export default function UniversityAssignCompaniesModal({ open, university, onClose, onAssigned }) {
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);

  /* Fetch companies when modal opens */
  useEffect(() => {
    if (!open) return;
    setSelectedIds([]);
    setSearch('');
    setLoadingCompanies(true);
    universityCompanyService
      .getCompanies()
      .then((data) => setCompanies(data))
      .catch((err) =>
        toast.error(err?.response?.data?.message || err?.message || 'Failed to load companies')
      )
      .finally(() => setLoadingCompanies(false));
  }, [open]);

  const filtered = companies.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.company_name || c.name || '').toLowerCase().includes(q) ||
      (c.company_code || c.code || '').toLowerCase().includes(q)
    );
  });

  const toggleCompany = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    const allFilteredIds = filtered.map((c) => c.uuid || c.id);
    const allSelected = allFilteredIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...allFilteredIds])]);
    }
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((c) => selectedIds.includes(c.uuid || c.id));

  const handleAssign = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one company');
      return;
    }
    setSaving(true);
    try {
      await universityCompanyService.assignToUniversity({
        university_id: university?.uuid || university?.id,
        company_ids: selectedIds,
      });
      toast.success(
        `${selectedIds.length} ${selectedIds.length === 1 ? 'company' : 'companies'} assigned successfully`
      );
      onAssigned?.();
      onClose?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to assign companies');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose?.()}
      title={`Assign Companies — ${university?.name || ''}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Info banner */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          Select one or more companies to assign to{' '}
          <span className="font-medium text-slate-900">{university?.name}</span>.
        </div>

        {/* Search + select-all row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search companies…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {filtered.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              {allFilteredSelected ? 'Deselect all' : 'Select all'}
            </button>
          )}
        </div>

        {/* Selection badge */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2 text-sm">
            <span className="font-medium text-brand-700">
              {selectedIds.length} {selectedIds.length === 1 ? 'company' : 'companies'} selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-brand-500 hover:text-brand-700 underline"
            >
              Clear
            </button>
          </div>
        )}

        {/* Company list */}
        <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
          {loadingCompanies ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading companies…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              {search ? 'No companies match your search.' : 'No companies found.'}
            </div>
          ) : (
            filtered.map((c) => {
              const id = c.uuid || c.id;
              const name = c.company_name || c.name || '—';
              const code = c.company_code || c.code || '';
              const isSelected = selectedIds.includes(id);

              return (
                <label
                  key={id}
                  className={`flex w-full cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 transition last:border-0 hover:bg-brand-50 ${
                    isSelected ? 'bg-brand-50' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCompany(id)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 accent-brand-600"
                  />

                  {/* Icon */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      isSelected ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                  </div>

                  {/* Name + code */}
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-medium ${isSelected ? 'text-brand-800' : 'text-slate-900'}`}>
                      {name}
                    </p>
                    {code && <p className="text-xs text-slate-400">{code}</p>}
                  </div>
                </label>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onClose?.()}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleAssign}
            disabled={saving || selectedIds.length === 0}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Assigning…
              </span>
            ) : (
              `Assign ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''}`
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

