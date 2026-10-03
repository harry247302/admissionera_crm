import { useForm } from 'react-hook-form';
import { Check } from 'lucide-react';
import FormField from './FormField';

export default function SessionForm({ onSubmit, loading, onCancel }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      status: true,
    },
  });

  const isActive = watch('status');

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit({
        name: data.name,
        status: Boolean(data.status),
      }))}
      className="space-y-5"
    >
      <FormField label="Session Name *" error={errors.name?.message}>
        <input
          className="input"
          placeholder="e.g. 2026-27"
          {...register('name', { required: 'Name is required' })}
        />
      </FormField>

      <FormField label="Status">
        <label className="mt-1 flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-900">
              {isActive ? 'Active' : 'Inactive'}
            </p>
            <p className="text-xs text-slate-500">
              {isActive ? 'This session is available for use.' : 'This session is hidden from selection.'}
            </p>
          </div>
          <span className="relative inline-flex items-center">
            <input type="checkbox" className="peer sr-only" {...register('status')} />
            <span className="h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500" />
            <span className="absolute left-0.5 top-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-emerald-600 shadow transition peer-checked:translate-x-5">
              {isActive ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
            </span>
          </span>
        </label>
      </FormField>

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
