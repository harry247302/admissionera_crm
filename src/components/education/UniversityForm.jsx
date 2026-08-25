import { useForm, Controller } from 'react-hook-form';
import FormField from './FormField';
import { UNIVERSITY_TYPES, ENTITY_STATUSES, formatLabel } from '../../utils/educationConstants';

export default function UniversityForm({ defaultValues, onSubmit, loading, onCancel }) {
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      status: 'ACTIVE',
      type: '',
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="University Name *" error={errors.name?.message}>
          <input className="input" placeholder="e.g. Amity University" {...register('name', { required: 'University name is required' })} />
        </FormField>
        <FormField label="Short Name / Code *" error={errors.code?.message}>
          <input className="input uppercase" placeholder="e.g. AMITY" {...register('code', { required: 'Code is required' })} />
        </FormField>
        <FormField label="University Type *" error={errors.type?.message}>
          <Controller
            name="type"
            control={control}
            rules={{ required: 'University type is required' }}
            render={({ field }) => (
              <select className="input" {...field}>
                <option value="">Select type</option>
                {UNIVERSITY_TYPES.map((type) => (
                  <option key={type} value={type}>{formatLabel(type)}</option>
                ))}
              </select>
            )}
          />
        </FormField>
        <FormField label="Location" error={errors.location?.message}>
          <input className="input" placeholder="City, State" {...register('location')} />
        </FormField>
        <FormField label="Website" error={errors.website?.message} className="sm:col-span-2">
          <input
            className="input"
            placeholder="https://"
            {...register('website', {
              validate: (v) => !v || /^https?:\/\//i.test(v) || 'Enter a valid URL starting with http:// or https://',
            })}
          />
        </FormField>
        <FormField label="Status">
          <select className="input" {...register('status')}>
            {ENTITY_STATUSES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Description">
        <textarea className="input min-h-[90px]" rows={4} placeholder="Short overview of the university" {...register('description')} />
      </FormField>
      <div className="flex justify-end gap-3">
        {onCancel && <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : defaultValues?.id ? 'Update University' : 'Save University'}
        </button>
      </div>
    </form>
  );
}
