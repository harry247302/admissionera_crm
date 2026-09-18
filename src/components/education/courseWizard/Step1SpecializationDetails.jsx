import FormField from '../FormField';
import { DURATION_UNITS, ENTITY_STATUSES, formatLabel } from '../../../utils/educationConstants';

export default function Step1SpecializationDetails({ register, errors }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Specialization Details</h3>
        <p className="mt-1 text-sm text-slate-500">
          Create a specialization in the catalog. Assign it to universities and courses from their respective pages.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Specialization Name *" error={errors.name?.message}>
          <input
            className="input"
            placeholder="e.g. Computer Science"
            {...register('name', { required: 'Name is required' })}
          />
        </FormField>
        <FormField label="Slug *" error={errors.slug?.message}>
          <input
            className="input lowercase"
            placeholder="e.g. computer-science"
            {...register('slug', { required: 'Slug is required' })}
          />
        </FormField>
        <FormField label="Code" error={errors.code?.message}>
          <input className="input uppercase" placeholder="e.g. CS" {...register('code')} />
        </FormField>
        <FormField label="Short Name">
          <input className="input" placeholder="e.g. CS" {...register('shortName')} />
        </FormField>
        <FormField label="Duration">
          <input type="number" min="0" step="0.5" className="input" {...register('duration')} />
        </FormField>
        <FormField label="Duration Unit">
          <select className="input" {...register('durationUnit')}>
            <option value="">Select unit</option>
            {DURATION_UNITS.map((unit) => (
              <option key={unit} value={unit}>{formatLabel(unit)}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Status">
          <select className="input" {...register('status')}>
            {ENTITY_STATUSES.map((s) => (
              <option key={s} value={s}>{formatLabel(s)}</option>
            ))}
          </select>
        </FormField>
      </div>
    </div>
  );
}
