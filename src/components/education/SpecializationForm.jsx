import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import FormField from './FormField';
import CourseContentTablesEditor, {
  emptyContentParagraphs,
  emptyContentTables,
  mapApiParagraphsToEditor,
  mapApiTablesToEditor,
} from './courseWizard/CourseContentTablesEditor';
import { specializationContentTableService } from '../../services/educationService';
import { DURATION_UNITS, ENTITY_STATUSES, formatLabel } from '../../utils/educationConstants';

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function SpecializationForm({ defaultValues, onSubmit, loading, onCancel }) {
  const isEditing = Boolean(defaultValues?.uuid || defaultValues?.id);
  const specializationId = defaultValues?.uuid || defaultValues?.id;

  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm({
    defaultValues: {
      status: 'ACTIVE',
      durationUnit: 'YEARS',
      duration: '',
      slug: '',
      shortName: '',
      ...defaultValues,
      shortName: defaultValues?.shortName || defaultValues?.short_name || '',
      durationUnit: defaultValues?.durationUnit || defaultValues?.duration_unit || 'YEARS',
      status:
        defaultValues?.status
        || (defaultValues?.is_active === false ? 'INACTIVE' : 'ACTIVE'),
    },
  });

  const [contentTables, setContentTables] = useState(() => (
    defaultValues?.contentTables?.length
      ? mapApiTablesToEditor(defaultValues.contentTables)
      : emptyContentTables()
  ));

  const [contentParagraphs, setContentParagraphs] = useState(() => (
    defaultValues?.contentParagraphs?.length
      ? mapApiParagraphsToEditor(defaultValues.contentParagraphs)
      : emptyContentParagraphs()
  ));

  const name = useWatch({ control, name: 'name' });

  useEffect(() => {
    if (isEditing || !name) return;
    setValue('slug', slugify(name));
  }, [name, isEditing, setValue]);

  useEffect(() => {
    if (!specializationId) return undefined;

    let cancelled = false;
    (async () => {
      try {
        if (!defaultValues?.contentTables?.length) {
          const res = await specializationContentTableService.getBySpecialization(specializationId);
          if (!cancelled && res.data?.length) {
            setContentTables(mapApiTablesToEditor(res.data));
          }
        }
        if (!defaultValues?.contentParagraphs?.length) {
          const res = await specializationContentTableService.getParagraphsBySpecialization(specializationId);
          if (!cancelled && res.data?.length) {
            setContentParagraphs(mapApiParagraphsToEditor(res.data));
          }
        }
      } catch {
        // Keep empty content if fetch fails
      }
    })();

    return () => { cancelled = true; };
  }, [specializationId, defaultValues?.contentTables, defaultValues?.contentParagraphs]);

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit({
        ...data,
        duration: data.duration === '' || data.duration == null ? null : Number(data.duration),
        contentTables,
        contentParagraphs,
      }))}
      className="space-y-5"
    >
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Create a specialization in the catalog. Assign it to universities and courses from their respective pages.
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
            {ENTITY_STATUSES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
          </select>
        </FormField>
      </div>

      <CourseContentTablesEditor
        value={contentTables}
        onChange={setContentTables}
        paragraphs={contentParagraphs}
        onParagraphsChange={setContentParagraphs}
      />

      <div className="flex justify-end gap-3">
        {onCancel && <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : isEditing ? 'Update Specialization' : 'Save Specialization'}
        </button>
      </div>
    </form>
  );
}
