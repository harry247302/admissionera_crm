import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import Step1SpecializationDetails from './courseWizard/Step1SpecializationDetails';
import Step2ContentTables from './courseWizard/Step2ContentTables';
import Step3ContentParagraphs from './courseWizard/Step3ContentParagraphs';
import WizardStepIndicator from './courseWizard/WizardStepIndicator';
import {
  SPECIALIZATION_FORM_STEPS,
  SPECIALIZATION_STEP1_FIELDS,
} from './courseWizard/courseWizardUtils';
import {
  emptyContentParagraphs,
  emptyContentTables,
  mapApiParagraphsToEditor,
  mapApiTablesToEditor,
} from './courseWizard/CourseContentTablesEditor';
import { specializationContentTableService } from '../../services/educationService';

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
  const [step, setStep] = useState(0);

  const { register, handleSubmit, setValue, control, trigger, formState: { errors } } = useForm({
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

  const goNext = async () => {
    if (step === 0) {
      const valid = await trigger(SPECIALIZATION_STEP1_FIELDS);
      if (!valid) {
        toast.error('Please fill required specialization details');
        return;
      }
    }
    setStep((s) => Math.min(s + 1, SPECIALIZATION_FORM_STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const saveSpecialization = handleSubmit(async (data) => {
    await onSubmit({
      ...data,
      duration: data.duration === '' || data.duration == null ? null : Number(data.duration),
      contentTables,
      contentParagraphs,
    });
  });

  const isLastStep = step === SPECIALIZATION_FORM_STEPS.length - 1;

  return (
    <form
      onSubmit={(e) => {
        // Prevent Enter in inputs from jumping steps / submitting early.
        e.preventDefault();
      }}
      className="space-y-5"
    >
      <WizardStepIndicator steps={SPECIALIZATION_FORM_STEPS} currentStep={step} />

      {step === 0 && (
        <Step1SpecializationDetails
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
              onClick={saveSpecialization}
            >
              {loading ? 'Saving...' : isEditing ? 'Update Specialization' : 'Save Specialization'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
