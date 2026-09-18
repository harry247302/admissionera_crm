import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Step1CourseDetails from './courseWizard/Step1CourseDetails';
import Step2ContentTables from './courseWizard/Step2ContentTables';
import Step3ContentParagraphs from './courseWizard/Step3ContentParagraphs';
import WizardStepIndicator from './courseWizard/WizardStepIndicator';
import { COURSE_FORM_STEPS, STEP1_FIELDS } from './courseWizard/courseWizardUtils';
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
  const [step, setStep] = useState(0);

  const { register, handleSubmit, trigger, formState: { errors } } = useForm({
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

  const goNext = async () => {
    if (step === 0) {
      const valid = await trigger(STEP1_FIELDS);
      if (!valid) {
        toast.error('Please fill required course details');
        return;
      }
    }
    setStep((s) => Math.min(s + 1, COURSE_FORM_STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const onFormSubmit = handleSubmit(async (data) => {
    await onSubmit({
      ...data,
      contentTables,
      contentParagraphs,
    });
  });

  const isLastStep = step === COURSE_FORM_STEPS.length - 1;

  return (
    <form
      onSubmit={(e) => {
        // Prevent Enter in inputs from jumping steps / submitting early.
        e.preventDefault();
      }}
      className="space-y-5"
    >
      <WizardStepIndicator steps={COURSE_FORM_STEPS} currentStep={step} />

      {step === 0 && (
        <Step1CourseDetails
          register={register}
          errors={errors}
        />
      )}

      {step === 1 && (
        <Step2ContentTables
          contentTables={contentTables}
          onContentTablesChange={setContentTables}
        />
      )}

      {step === 2 && (
        <Step3ContentParagraphs
          contentParagraphs={contentParagraphs}
          onContentParagraphsChange={setContentParagraphs}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div>
          {onCancel && step === 0 && (
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
          {step > 0 && (
            <button type="button" className="btn-secondary" onClick={goBack}>
              Back
            </button>
          )}
        </div>
        <div className="flex gap-3">
          {!isLastStep ? (
            <button type="button" className="btn-primary" onClick={goNext}>
              Next
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              disabled={loading}
              onClick={onFormSubmit}
            >
              {loading ? 'Saving...' : isEditing ? 'Update Course' : 'Create Course'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
