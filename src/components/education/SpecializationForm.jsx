import { useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import FormField from './FormField';
import UniversitySelect from './UniversitySelect';
import CourseSelect from './CourseSelect';
import { ENTITY_STATUSES, formatLabel } from '../../utils/educationConstants';

export default function SpecializationForm({
  defaultValues,
  universities = [],
  courses = [],
  onUniversityChange,
  onSubmit,
  loading,
  onCancel,
}) {
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm({
    defaultValues: {
      status: 'ACTIVE',
      ...defaultValues,
      universityId: defaultValues?.universityId || '',
      courseId: defaultValues?.courseId || '',
    },
  });

  const universityId = useWatch({ control, name: 'universityId' });

  useEffect(() => {
    onUniversityChange?.(universityId);
  }, [universityId, onUniversityChange]);

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit({
        ...data,
        universityId: Number(data.universityId),
        courseId: Number(data.courseId),
      }))}
      className="space-y-5"
    >
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Select a university first. Courses will load only for that university, then attach the specialization to the chosen course.
      </div>

      <FormField label="University *" error={errors.universityId?.message}>
        <Controller
          name="universityId"
          control={control}
          rules={{ required: 'Select a university' }}
          render={({ field }) => (
            <UniversitySelect
              universities={universities}
              value={field.value}
              error={Boolean(errors.universityId)}
              onChange={(val) => {
                field.onChange(val);
                setValue('courseId', '');
              }}
            />
          )}
        />
      </FormField>

      <FormField label="Course *" error={errors.courseId?.message}>
        <Controller
          name="courseId"
          control={control}
          rules={{ required: 'Select a course' }}
          render={({ field }) => (
            <CourseSelect
              courses={courses}
              universityId={universityId}
              value={field.value}
              onChange={field.onChange}
              error={Boolean(errors.courseId)}
            />
          )}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Specialization Name *" error={errors.name?.message}>
          <input className="input" placeholder="e.g. Finance" {...register('name', { required: 'Name is required' })} />
        </FormField>
        <FormField label="Specialization Code *" error={errors.code?.message}>
          <input className="input uppercase" placeholder="e.g. MBA-FIN" {...register('code', { required: 'Code is required' })} />
        </FormField>
        <FormField label="Status">
          <select className="input" {...register('status')}>
            {ENTITY_STATUSES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
          </select>
        </FormField>
      </div>

      <FormField label="Description">
        <textarea className="input min-h-[80px]" rows={3} {...register('description')} />
      </FormField>
      <FormField label="Eligibility">
        <textarea className="input min-h-[80px]" rows={3} {...register('eligibility')} />
      </FormField>

      <div className="flex justify-end gap-3">
        {onCancel && <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : defaultValues?.id ? 'Update Specialization' : 'Save Specialization'}
        </button>
      </div>
    </form>
  );
}
