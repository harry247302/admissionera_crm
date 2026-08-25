import { useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import FormField from './FormField';
import UniversitySelect from './UniversitySelect';
import { COURSE_LEVELS, DURATION_UNITS, ENTITY_STATUSES, formatLabel } from '../../utils/educationConstants';

export default function CourseForm({ defaultValues, universities = [], onSubmit, loading, onCancel }) {
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm({
    defaultValues: {
      status: 'ACTIVE',
      durationUnit: 'YEARS',
      level: '',
      duration: '',
      numberOfSemesters: '',
      numberOfYears: '',
      ...defaultValues,
      universityId: defaultValues?.universityId || '',
    },
  });

  const durationUnit = useWatch({ control, name: 'durationUnit' });
  const duration = useWatch({ control, name: 'duration' });

  useEffect(() => {
    if (!duration) return;
    if (durationUnit === 'YEARS') setValue('numberOfYears', duration);
    if (durationUnit === 'SEMESTERS') setValue('numberOfSemesters', duration);
  }, [duration, durationUnit, setValue]);

  return (
    <form onSubmit={handleSubmit((data) => onSubmit({
      ...data,
      universityId: Number(data.universityId),
      duration: Number(data.duration) || 0,
      numberOfSemesters: Number(data.numberOfSemesters) || 0,
      numberOfYears: Number(data.numberOfYears) || 0,
    }))} className="space-y-5">
      <FormField label="University *" error={errors.universityId?.message}>
        <Controller
          name="universityId"
          control={control}
          rules={{ required: 'Select a university' }}
          render={({ field }) => (
            <UniversitySelect
              universities={universities}
              value={field.value}
              onChange={field.onChange}
              error={Boolean(errors.universityId)}
              activeOnly={!defaultValues?.id}
            />
          )}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Course Name *" error={errors.name?.message}>
          <input className="input" placeholder="e.g. Master of Business Administration" {...register('name', { required: 'Course name is required' })} />
        </FormField>
        <FormField label="Course Code *" error={errors.code?.message}>
          <input className="input uppercase" placeholder="e.g. MBA" {...register('code', { required: 'Course code is required' })} />
        </FormField>
        <FormField label="Course Level *" error={errors.level?.message}>
          <select className="input" {...register('level', { required: 'Course level is required' })}>
            <option value="">Select level</option>
            {COURSE_LEVELS.map((level) => <option key={level} value={level}>{formatLabel(level)}</option>)}
          </select>
        </FormField>
        <FormField label="Status">
          <select className="input" {...register('status')}>
            {ENTITY_STATUSES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
          </select>
        </FormField>
        <FormField label="Duration *" error={errors.duration?.message}>
          <input type="number" min="0" step="0.5" className="input" {...register('duration', { required: 'Duration is required', min: { value: 0.5, message: 'Duration must be greater than 0' } })} />
        </FormField>
        <FormField label="Duration Unit *" error={errors.durationUnit?.message}>
          <select className="input" {...register('durationUnit', { required: 'Required' })}>
            {DURATION_UNITS.map((u) => <option key={u} value={u}>{formatLabel(u)}</option>)}
          </select>
        </FormField>
        <FormField label="Number of Semesters">
          <input type="number" min="0" className="input" {...register('numberOfSemesters')} />
        </FormField>
        <FormField label="Number of Years">
          <input type="number" min="0" step="0.5" className="input" {...register('numberOfYears')} />
        </FormField>
      </div>

      <FormField label="Course Description">
        <textarea className="input min-h-[80px]" rows={3} {...register('description')} />
      </FormField>
      <FormField label="Eligibility">
        <textarea className="input min-h-[80px]" rows={3} placeholder="Minimum qualification and entrance requirements" {...register('eligibility')} />
      </FormField>

      <div className="flex justify-end gap-3">
        {onCancel && <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : defaultValues?.id ? 'Update Course' : 'Save Course'}
        </button>
      </div>
    </form>
  );
}
