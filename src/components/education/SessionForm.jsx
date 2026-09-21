import { useForm } from 'react-hook-form';
import FormField from './FormField';

export default function SessionForm({ onSubmit, loading, onCancel }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      start_date: '',
      expiry_date: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormField label="Session Name *" error={errors.name?.message}>
        <input
          className="input"
          placeholder="e.g. 2026-27"
          {...register('name', { required: 'Name is required' })}
        />
      </FormField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Start Date *" error={errors.start_date?.message}>
          <input
            type="date"
            className="input"
            {...register('start_date', { required: 'Start date is required' })}
          />
        </FormField>
        <FormField label="Expiry Date *" error={errors.expiry_date?.message}>
          <input
            type="date"
            className="input"
            {...register('expiry_date', { required: 'Expiry date is required' })}
          />
        </FormField>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Create Session'}
        </button>
      </div>
    </form>
  );
}
