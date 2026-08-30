import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import { academicSpecializationService } from '../../services/educationService';

export default function UniversityAssignSpecializationsModal({
  open,
  university,
  onClose,
  onAssigned,
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [allSpecializations, setAllSpecializations] = useState([]);
  const [assignedIds, setAssignedIds] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(new Set());

  const universityUuid = university?.uuid;

  useEffect(() => {
    if (!open || !universityUuid) return;

    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setSearch('');
      setSelectedIds(new Set());

      try {
        const [allRes, assignedRes] = await Promise.all([
          academicSpecializationService.getCatalog(),
          academicSpecializationService.getUniversitySpecializations(universityUuid),
        ]);

        if (cancelled) return;

        setAllSpecializations(allRes.data?.specializations || []);
        const assigned = new Set(
          (assignedRes.data?.specializations || []).map((item) => String(item.uuid))
        );
        setAssignedIds(assigned);
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error.response?.data?.message ||
              error.message ||
              'Failed to load specializations'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [open, universityUuid]);

  const filteredSpecializations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allSpecializations;

    return allSpecializations.filter((item) =>
      [item.name, item.code, item.slug, item.short_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [allSpecializations, search]);

  const toggleSelection = (uuid) => {
    const key = String(uuid);
    if (assignedIds.has(key)) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = (checked) => {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }

    const next = new Set(
      filteredSpecializations
        .filter((item) => !assignedIds.has(String(item.uuid)))
        .map((item) => String(item.uuid))
    );
    setSelectedIds(next);
  };

  const handleAssign = async () => {
    if (!universityUuid) {
      toast.error('University UUID is missing');
      return;
    }

    if (selectedIds.size === 0) {
      toast.error('Select at least one specialization');
      return;
    }

    setSaving(true);

    try {
      const results = await Promise.allSettled(
        [...selectedIds].map((specializationUuid) =>
          academicSpecializationService.assignToUniversity({
            university_uuid: universityUuid,
            specialization_uuid: specializationUuid,
          })
        )
      );

      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.length - succeeded;

      if (succeeded > 0) {
        toast.success(`${succeeded} specialization(s) assigned successfully`);
        onAssigned?.();
      }

      if (failed > 0) {
        toast.error(`${failed} specialization(s) could not be assigned`);
      }

      if (succeeded > 0) {
        onClose?.();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Failed to assign specializations'
      );
    } finally {
      setSaving(false);
    }
  };

  const selectableCount = filteredSpecializations.filter(
    (item) => !assignedIds.has(String(item.uuid))
  ).length;

  const allSelectableSelected =
    selectableCount > 0 &&
    filteredSpecializations
      .filter((item) => !assignedIds.has(String(item.uuid)))
      .every((item) => selectedIds.has(String(item.uuid)));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Assign Specializations — ${university?.name || 'University'}`}
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Select specializations to link with this university. Already assigned items are marked and cannot be selected again.
        </p>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search specializations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading specializations...
          </div>
        ) : filteredSpecializations.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            No specializations found.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={allSelectableSelected}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  disabled={selectableCount === 0}
                />
                Select all available
              </label>
              <span className="text-xs text-slate-500">
                {selectedIds.size} selected · {assignedIds.size} already assigned
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {filteredSpecializations.map((item) => {
                const uuid = String(item.uuid);
                const isAssigned = assignedIds.has(uuid);
                const isSelected = selectedIds.has(uuid);

                return (
                  <label
                    key={uuid}
                    className={`flex items-start gap-3 px-4 py-3 ${
                      isAssigned ? 'bg-slate-50 opacity-70' : 'hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={isAssigned || isSelected}
                      disabled={isAssigned}
                      onChange={() => toggleSelection(uuid)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">{item.name}</p>
                        {isAssigned && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            Assigned
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {[item.code, item.slug].filter(Boolean).join(' · ') || uuid}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleAssign}
            disabled={loading || saving || selectedIds.size === 0}
          >
            {saving ? 'Assigning...' : `Assign Selected (${selectedIds.size})`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
