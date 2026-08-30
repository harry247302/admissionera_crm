import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import WizardStepIndicator from './courseWizard/WizardStepIndicator';
import Step1CourseDetails from './courseWizard/Step1CourseDetails';
import Step2Specializations from './courseWizard/Step2Specializations';
import Step3FeeStructure from './courseWizard/Step3FeeStructure';
import Step4Review from './courseWizard/Step4Review';
import {
  WIZARD_STEPS,
  STEP1_FIELDS,
  emptySpecialization,
  initialFeesState,
  slugify,
} from './courseWizard/courseWizardUtils';

const normalizeCourseFormValues = (defaultValues = {}) => ({
  status: 'ACTIVE',
  currency: 'USD',
  level: '',
  degree: '',
  department: '',
  faculty: '',
  studyMode: '',
  attendanceMode: '',
  language: '',
  description: '',
  overview: '',
  eligibility: '',
  curriculum: '',
  careerOpportunities: '',
  ...defaultValues,
  universityId: defaultValues?.universityId || '',
});

export default function CourseForm({
  defaultValues,
  universities = [],
  onSubmit,
  loading,
  onCancel,
  wizardMode = true,
}) {
  const isEditing = Boolean(defaultValues?.uuid || defaultValues?.id);
  const useWizard = wizardMode && !isEditing;

  const { register, handleSubmit, control, getValues, trigger, formState: { errors } } = useForm({
    defaultValues: normalizeCourseFormValues(defaultValues),
  });

  const universityId = useWatch({ control, name: 'universityId' });
  const currency = useWatch({ control, name: 'currency' });

  const [step, setStep] = useState(0);
  const [specializations, setSpecializations] = useState([emptySpecialization()]);
  const [fees, setFees] = useState(() => initialFeesState(defaultValues?.currency || 'USD'));
  const [draftCourse, setDraftCourse] = useState(
    isEditing ? { uuid: defaultValues?.uuid || defaultValues?.id, id: defaultValues?.id || defaultValues?.uuid } : null
  );
  const [stepErrors, setStepErrors] = useState({});
  const [savingDraft, setSavingDraft] = useState(false);

  const selectedUniversity = useMemo(
    () => universities.find((u) => String(u.id) === String(universityId)),
    [universities, universityId]
  );

  useEffect(() => {
    setFees((prev) => ({ ...prev, currency: currency || prev.currency || 'USD' }));
  }, [currency]);

  const buildCoursePayload = (data) => ({
    ...data,
    universityId: data.universityId,
    universityUuid: selectedUniversity?.uuid || data.universityUuid,
  });

  const validateStep2 = () => {
    const nextErrors = {};
    const filled = specializations.filter((item) =>
      item.name?.trim() || item.code?.trim() || item.description?.trim()
    );

    if (!filled.length) {
      nextErrors.general = 'Add at least one specialization with a name.';
    }

    filled.forEach((item) => {
      if (!item.name?.trim()) {
        nextErrors[`name-${item.clientId}`] = 'Specialization name is required';
      }
    });

    const partial = specializations.filter((item) => {
      const hasAny = item.name?.trim() || item.code?.trim() || item.description?.trim();
      const hasName = item.name?.trim();
      return hasAny && !hasName;
    });
    partial.forEach((item) => {
      nextErrors[`name-${item.clientId}`] = 'Specialization name is required';
    });

    setStepErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep3 = () => {
    const nextErrors = {};
    if (fees.activeType === 'ONE_TIME') {
      const total = Number(fees.oneTime.tuitionFee || 0) + Number(fees.oneTime.otherFee || 0);
      if (total <= 0) nextErrors.general = 'Enter a valid one-time fee greater than zero.';
    } else {
      const rows = fees.activeType === 'YEAR' ? fees.yearly : fees.semester;
      const invalidIndex = rows.findIndex((row) => {
        const total = Number(row.tuitionFee || 0) + Number(row.otherFee || 0);
        return total <= 0;
      });
      if (invalidIndex !== -1) {
        const label = fees.activeType === 'YEAR' ? 'Year' : 'Semester';
        nextErrors.items = `${label} ${invalidIndex + 1} must have a total greater than zero`;
      }
    }
    setStepErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveDraftCourse = async (courseData) => {
    if (draftCourse?.uuid) {
      return onSubmit({
        phase: 'draft-update',
        course: courseData,
        courseUuid: draftCourse.uuid,
        courseId: draftCourse.id,
      });
    }
    setSavingDraft(true);
    try {
      const result = await onSubmit({
        phase: 'draft-create',
        course: courseData,
      });
      if (result?.courseUuid) {
        setDraftCourse({ uuid: result.courseUuid, id: result.courseId || result.courseUuid });
      }
      return result;
    } finally {
      setSavingDraft(false);
    }
  };

  const goNext = async () => {
    if (step === 0) {
      const valid = await trigger(STEP1_FIELDS);
      if (!valid) return;
      const courseData = buildCoursePayload(getValues());
      if (useWizard) {
        try {
          await saveDraftCourse(courseData);
        } catch (err) {
          toast.error(typeof err === 'string' ? err : err?.message || 'Failed to save course draft');
          return;
        }
      }
      setStepErrors({});
      setStep(1);
      return;
    }

    if (step === 1) {
      if (!validateStep2()) return;
      if (!draftCourse?.uuid) {
        toast.error('Complete Step 1 and save the course before adding specializations');
        return;
      }

      setSavingDraft(true);
      try {
        const validSpecs = specializations
          .filter((item) => item.name?.trim())
          .map((item) => ({
            ...item,
            slug: slugify(item.code || item.name),
          }));

        const result = await onSubmit({
          phase: 'save-specializations',
          courseUuid: draftCourse.uuid,
          specializations: validSpecs,
        });

        if (result?.specializations) {
          setSpecializations(result.specializations);
        }

        setStepErrors({});
        setStep(2);
      } catch (err) {
        toast.error(typeof err === 'string' ? err : err?.message || 'Failed to save specializations');
      } finally {
        setSavingDraft(false);
      }
      return;
    }

    if (step === 2) {
      if (!validateStep3()) return;
      setStepErrors({});
      setStep(3);
    }
  };

  const goBack = () => {
    setStepErrors({});
    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleFinalSubmit = handleSubmit(async (data) => {
    const courseData = buildCoursePayload(data);
    const validSpecs = specializations.filter((item) => item.name?.trim());

    if (useWizard && !validateStep2()) {
      setStep(1);
      return;
    }
    if (useWizard && !validateStep3()) {
      setStep(2);
      return;
    }

    try {
      await onSubmit({
        phase: 'final',
        course: courseData,
        specializations: validSpecs.map((item) => ({
          ...item,
          slug: slugify(item.code || item.name),
        })),
        fees,
        courseUuid: draftCourse?.uuid,
        courseId: draftCourse?.id,
        universityUuid: selectedUniversity?.uuid,
      });
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to submit course');
    }
  });

  const handleLegacySubmit = handleSubmit((data) => {
    onSubmit(buildCoursePayload(data));
  });

  if (!useWizard) {
    return (
      <form onSubmit={handleLegacySubmit} className="space-y-5">
        <Step1CourseDetails
          register={register}
          control={control}
          errors={errors}
          universities={universities}
          isEditing={isEditing}
        />
        <div className="flex justify-end gap-3">
          {onCancel && <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEditing ? 'Update Course' : 'Save Course'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <WizardStepIndicator steps={WIZARD_STEPS} currentStep={step} />

      {step === 0 && (
        <Step1CourseDetails
          register={register}
          control={control}
          errors={errors}
          universities={universities}
          isEditing={isEditing}
        />
      )}

      {step === 1 && (
        <Step2Specializations
          specializations={specializations}
          onChange={setSpecializations}
          errors={stepErrors}
          saving={savingDraft}
        />
      )}

      {step === 2 && (
        <Step3FeeStructure
          fees={fees}
          onChange={setFees}
          errors={stepErrors}
        />
      )}

      {step === 3 && (
        <Step4Review
          courseData={getValues()}
          specializations={specializations}
          fees={fees}
          universityName={selectedUniversity?.name}
          onEditStep={setStep}
        />
      )}

      <div className="flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-4">
        <div>
          {onCancel && (
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {step > 0 && (
            <button type="button" className="btn-secondary" onClick={goBack}>Back</button>
          )}
          {step < WIZARD_STEPS.length - 1 ? (
            <button
              type="button"
              className="btn-primary"
              onClick={goNext}
              disabled={savingDraft || loading}
            >
              {savingDraft ? (step === 1 ? 'Saving specializations...' : 'Saving...') : 'Next'}
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              disabled={loading}
              onClick={handleFinalSubmit}
            >
              {loading ? 'Submitting...' : 'Create Course'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
