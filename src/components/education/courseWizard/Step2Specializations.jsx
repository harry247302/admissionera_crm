import { Plus, Trash2 } from 'lucide-react';
import FormField from '../FormField';
import { ENTITY_STATUSES, formatLabel } from '../../../utils/educationConstants';
import { emptySpecialization } from './courseWizardUtils';

export default function Step2Specializations({
  specializations,
  onChange,
  errors = {},
  saving = false,
}) {
  const updateSpec = (clientId, patch) => {
    onChange(specializations.map((item) => (
      item.clientId === clientId ? { ...item, ...patch } : item
    )));
  };

  const removeSpec = (clientId) => {
    if (specializations.length <= 1) return;
    onChange(specializations.filter((item) => item.clientId !== clientId));
  };

  const addSpec = () => {
    onChange([...specializations, emptySpecialization()]);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Add one or more specializations for this course. Clicking Next creates each specialization in the catalog and links them to the course via the course-specializations API.
      </div>

      {errors.general && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.general}</p>
      )}

      <div className="space-y-4">
        {specializations.map((spec, index) => {
          const isSaved = Boolean(spec.savedUuid);

          return (
            <div key={spec.clientId} className="card space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">Specialization {index + 1}</h3>
                  {isSaved && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Linked
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 disabled:opacity-40"
                  onClick={() => removeSpec(spec.clientId)}
                  disabled={specializations.length <= 1 || isSaved || saving}
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Name *" error={errors[`name-${spec.clientId}`]}>
                  <input
                    className="input"
                    placeholder="e.g. Computer Science"
                    value={spec.name}
                    disabled={isSaved || saving}
                    onChange={(e) => updateSpec(spec.clientId, { name: e.target.value })}
                  />
                </FormField>
                <FormField label="Code">
                  <input
                    className="input uppercase"
                    placeholder="e.g. CS"
                    value={spec.code}
                    disabled={isSaved || saving}
                    onChange={(e) => updateSpec(spec.clientId, { code: e.target.value })}
                  />
                </FormField>
                <FormField label="Status">
                  <select
                    className="input"
                    value={spec.status}
                    disabled={isSaved || saving}
                    onChange={(e) => updateSpec(spec.clientId, { status: e.target.value })}
                  >
                    {ENTITY_STATUSES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
                  </select>
                </FormField>
              </div>

              <FormField label="Description">
                <textarea
                  className="input min-h-[80px]"
                  rows={3}
                  value={spec.description}
                  disabled={isSaved || saving}
                  onChange={(e) => updateSpec(spec.clientId, { description: e.target.value })}
                />
              </FormField>
            </div>
          );
        })}
      </div>

      <button type="button" className="btn-secondary" onClick={addSpec} disabled={saving}>
        <Plus className="h-4 w-4" /> Add Another Specialization
      </button>
    </div>
  );
}
