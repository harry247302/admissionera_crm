import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Step1CourseDetails from './courseWizard/Step1CourseDetails';
import {
  emptyContentParagraphs,
  emptyContentTables,
  mapApiParagraphsToEditor,
  mapApiTablesToEditor,
} from './courseWizard/CourseContentTablesEditor';
import { courseContentTableService } from '../../services/educationService';

const normalizeCourseFormValues = (defaultValues = {}) => ({
  status: 'ACTIVE',
  level: '',
  degree: '',
  code: '',
  name: '',
  currency: 'USD',
  department: '',
  studyMode: '',
  attendanceMode: '',
  language: '',
  ...defaultValues,
  studyMode: defaultValues?.studyMode || defaultValues?.study_mode || '',
  attendanceMode: defaultValues?.attendanceMode || defaultValues?.attendance_mode || '',
  currency: defaultValues?.currency || 'USD',
  status:
    defaultValues?.status
    || (defaultValues?.is_active === false ? 'INACTIVE' : 'ACTIVE'),
});

export default function CourseForm({
  defaultValues,
  onSubmit,
  loading,
  onCancel,
}) {
  const isEditing = Boolean(defaultValues?.uuid || defaultValues?.id);
  const courseId = defaultValues?.uuid || defaultValues?.id;

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: normalizeCourseFormValues(defaultValues),
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

  useEffect(() => {
    if (!courseId) return undefined;

    let cancelled = false;
    (async () => {
      try {
        if (!defaultValues?.contentTables?.length) {
          const res = await courseContentTableService.getByCourse(courseId);
          if (!cancelled && res.data?.length) {
            setContentTables(mapApiTablesToEditor(res.data));
          }
        }
        if (!defaultValues?.contentParagraphs?.length) {
          const res = await courseContentTableService.getParagraphsByCourse(courseId);
          if (!cancelled && res.data?.length) {
            setContentParagraphs(mapApiParagraphsToEditor(res.data));
          }
        }
      } catch {
        // Keep empty content if fetch fails
      }
    })();

    return () => { cancelled = true; };
  }, [courseId, defaultValues?.contentTables, defaultValues?.contentParagraphs]);

  const onFormSubmit = handleSubmit(async (data) => {
    await onSubmit({
      ...data,
      contentTables,
      contentParagraphs,
    });
  });

  return (
    <form onSubmit={onFormSubmit} className="space-y-5">
      <Step1CourseDetails
        register={register}
        errors={errors}
        contentTables={contentTables}
        onContentTablesChange={setContentTables}
        contentParagraphs={contentParagraphs}
        onContentParagraphsChange={setContentParagraphs}
      />
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : isEditing ? 'Update Course' : 'Create Course'}
        </button>
      </div>
    </form>
  );
}
