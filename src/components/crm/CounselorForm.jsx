import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, ArrowRight, Camera, X } from 'lucide-react';
import FormField from '../education/FormField';
import CourseContentTablesEditor, {
  mapApiParagraphsToEditor,
} from '../education/courseWizard/CourseContentTablesEditor';
import WizardStepIndicator from '../education/courseWizard/WizardStepIndicator';
import { counselorService } from '../../services/crmService';
import { INDIAN_STATES } from '../../utils/indianStates';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[6-9]\d{9}$/;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const STEPS = [
  { key: 'profile', label: 'Profile', fields: ['firstName', 'lastName', 'email', 'phone', 'alternatePhone'] },
  {
    key: 'professional',
    label: 'Professional',
    fields: [
      'designation', 'qualification', 'experienceYears', 'ratings', 'responseRate',
      'state', 'careerDevelopment', 'notes',
    ],
  },
  { key: 'tables', label: 'Tables', fields: [] },
  { key: 'paragraphs', label: 'Paragraphs', fields: [] },
];

export default function CounselorForm({ counselor, existingImageUrl = '', onSubmit, loading, onCancel }) {
  const isEdit = Boolean(counselor);
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [removeExisting, setRemoveExisting] = useState(false);
  const [imageError, setImageError] = useState('');
  const [tables, setTables] = useState([]);
  const [paragraphs, setParagraphs] = useState([]);
  const [paragraphsLoading, setParagraphsLoading] = useState(false);
  const [paragraphsLoadError, setParagraphsLoadError] = useState('');
  const [contentError, setContentError] = useState('');

  const { register, handleSubmit, getValues, trigger, formState: { errors } } = useForm({
    defaultValues: {
      firstName: counselor?.firstName || '',
      lastName: counselor?.lastName || '',
      email: counselor?.email || '',
      phone: counselor?.phone || '',
      alternatePhone: counselor?.alternatePhone || '',
      qualification: counselor?.qualification || '',
      experienceYears: counselor?.experienceYears ?? '',
      designation: counselor?.designation || '',
      ratings: counselor?.ratings ?? '',
      responseRate: counselor?.responseRate || '',
      careerDevelopment: counselor?.careerDevelopment || '',
      state: counselor?.state || '',
      notes: counselor?.notes || '',
      status: counselor?.status === false ? 'INACTIVE' : 'ACTIVE',
    },
  });

  useEffect(() => {
    if (!imageFile) {
      setFilePreview('');
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    const counselorId = counselor?.id || counselor?.uuid;
    if (!counselorId) return undefined;

    let cancelled = false;
    setParagraphsLoading(true);
    setParagraphsLoadError('');

    (async () => {
      try {
        const paragraphRows = await counselorService.getParagraphs(counselorId);
        if (cancelled) return;
        setParagraphs(mapApiParagraphsToEditor(paragraphRows));
      } catch (err) {
        if (cancelled) return;
        const message = err?.response?.data?.message || err?.message || 'Failed to load counsellor content';
        setParagraphsLoadError(message);
      } finally {
        if (!cancelled) {
          setParagraphsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [counselor?.id, counselor?.uuid]);

  const imagePreview = filePreview || (removeExisting ? '' : existingImageUrl);
  const isLastStep = step === STEPS.length - 1;

  const clearImage = () => {
    if (imageFile) {
      setImageFile(null);
    } else if (existingImageUrl) {
      setRemoveExisting(true);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const pickImage = (event) => {
    const file = event.target.files?.[0];
    setImageError('');
    if (!file) return;
    const rejectFile = (message) => {
      setImageError(message);
      event.target.value = '';
    };
    if (!file.type.startsWith('image/')) return rejectFile('Only image files are allowed');
    if (file.size > MAX_IMAGE_BYTES) return rejectFile('Image must be under 2MB');
    setImageFile(file);
  };

  const goNext = async () => {
    const valid = await trigger(STEPS[step].fields);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const submit = handleSubmit(({ status, ...data }) => {
    const missingContent = paragraphs.findIndex((p) => p.title.trim() && !p.content.trim());
    if (missingContent !== -1) {
      setContentError(`Paragraph ${missingContent + 1} has a title but no content.`);
      return undefined;
    }
    setContentError('');
    return onSubmit({
      ...data,
      profileImg: imageFile || undefined,
      content: { tables, paragraphs },
      ...(isEdit && {
        status: status === 'ACTIVE',
        removeProfileImg: removeExisting && !imageFile,
      }),
    });
  }, (fieldErrors) => {
    const firstInvalid = STEPS.findIndex((s) => s.fields.some((field) => fieldErrors[field]));
    if (firstInvalid !== -1) setStep(firstInvalid);
  });

  const handleFormSubmit = (event) => {
    event.preventDefault();
    if (isLastStep) submit();
    else goNext();
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5" noValidate>
      <WizardStepIndicator steps={STEPS} currentStep={step} />

      {step === 0 && (
        <>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:border-brand-400 hover:text-brand-500"
                aria-label={imagePreview ? 'Change profile image' : 'Upload profile image'}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile preview" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-6 w-6" />
                )}
              </button>
              {imagePreview ? (
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute -right-1 -top-1 rounded-full bg-white p-1 text-slate-500 shadow ring-1 ring-slate-200 hover:text-red-600"
                  aria-label="Remove profile image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            <div className="text-sm">
              <p className="font-medium text-slate-700">Profile Image</p>
              <p className="text-xs text-slate-400">JPG, PNG or WebP, up to 2MB. Optional.</p>
              {imageError ? <p className="mt-1 text-xs text-red-600">{imageError}</p> : null}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="First Name *" error={errors.firstName?.message}>
              <input
                className="input"
                placeholder="e.g. Shadab"
                autoComplete="given-name"
                {...register('firstName', {
                  required: 'First name is required',
                  validate: (v) => v.trim().length > 0 || 'First name is required',
                })}
              />
            </FormField>
            <FormField label="Last Name *" error={errors.lastName?.message}>
              <input
                className="input"
                placeholder="e.g. Shaikh"
                autoComplete="family-name"
                {...register('lastName', {
                  required: 'Last name is required',
                  validate: (v) => v.trim().length > 0 || 'Last name is required',
                })}
              />
            </FormField>
          </div>

          <FormField label="Email *" error={errors.email?.message}>
            <input
              type="email"
              className="input"
              placeholder="name@example.com"
              autoComplete="email"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: EMAIL_PATTERN, message: 'Enter a valid email address' },
              })}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Phone *" error={errors.phone?.message} hint="10-digit mobile number">
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                className="input"
                placeholder="9876543210"
                autoComplete="tel-national"
                {...register('phone', {
                  required: 'Phone is required',
                  pattern: { value: PHONE_PATTERN, message: 'Enter a valid 10-digit mobile number' },
                })}
              />
            </FormField>
            <FormField label="Alternate Phone" error={errors.alternatePhone?.message}>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                className="input"
                placeholder="Optional"
                {...register('alternatePhone', {
                  validate: (v) => {
                    if (!v.trim()) return true;
                    if (!PHONE_PATTERN.test(v.trim())) return 'Enter a valid 10-digit mobile number';
                    return v.trim() !== getValues('phone').trim() || 'Must be different from phone';
                  },
                })}
              />
            </FormField>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <FormField label="Designation" error={errors.designation?.message}>
            <input
              className="input"
              placeholder="e.g. Senior Career Development Advisor"
              maxLength={150}
              {...register('designation', {
                validate: (v) => v.trim().length <= 150 || 'Designation must be 150 characters or fewer',
              })}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Qualification" error={errors.qualification?.message}>
              <input
                className="input"
                placeholder="e.g. MBA, M.Sc Psychology"
                maxLength={255}
                {...register('qualification')}
              />
            </FormField>
            <FormField label="Experience (Years)" error={errors.experienceYears?.message}>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={60}
                step={1}
                className="input"
                placeholder="e.g. 3"
                {...register('experienceYears', {
                  validate: (v) => {
                    if (v === '' || v === null || v === undefined) return true;
                    const n = Number(v);
                    return (Number.isInteger(n) && n >= 0 && n <= 60) || 'Enter whole years between 0 and 60';
                  },
                })}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Rating" error={errors.ratings?.message} hint="0 to 5, e.g. 4.8">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={5}
                step={0.1}
                className="input"
                placeholder="e.g. 4.8"
                {...register('ratings', {
                  validate: (v) => {
                    const text = String(v ?? '').trim();
                    if (!text) return true;
                    const n = Number(text);
                    return (/^\d(\.\d)?$/.test(text) && n >= 0 && n <= 5) || 'Enter a rating between 0 and 5 (one decimal)';
                  },
                })}
              />
            </FormField>
            <FormField label="Response Rate (%)" error={errors.responseRate?.message}>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                step={1}
                className="input"
                placeholder="e.g. 98"
                {...register('responseRate', {
                  validate: (v) => {
                    const text = String(v ?? '').trim();
                    if (!text) return true;
                    const n = Number(text);
                    return (Number.isInteger(n) && n >= 0 && n <= 100) || 'Enter a whole percentage between 0 and 100';
                  },
                })}
              />
            </FormField>
          </div>

          <div className={isEdit ? 'grid gap-4 sm:grid-cols-2' : ''}>
            <FormField label="State" error={errors.state?.message}>
              <select className="input" {...register('state')}>
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
            </FormField>
            {isEdit ? (
              <FormField label="Status">
                <select className="input" {...register('status')}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </FormField>
            ) : null}
          </div>

          <FormField label="Career Development" error={errors.careerDevelopment?.message}>
            <textarea
              rows={3}
              className="input resize-y"
              placeholder="Certifications, trainings and career milestones…"
              {...register('careerDevelopment')}
            />
          </FormField>

          <FormField label="Notes" error={errors.notes?.message}>
            <textarea
              rows={4}
              className="input resize-y"
              placeholder="Languages spoken, specialisation areas, availability…"
              {...register('notes')}
            />
          </FormField>
        </>
      )}

      {step === 2 && (
        <>
          {isEdit ? (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Existing tables are loaded from this counsellor. New tables are added alongside them.
            </p>
          ) : null}
          <CourseContentTablesEditor
            value={tables}
            onChange={setTables}
            mode="tables"
            counsellorId={counselor?.id || counselor?.uuid}
          />
        </>
      )}

      {step === 3 && (
        <>
          {isEdit ? (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Existing paragraphs are loaded from this counsellor. New paragraphs are added alongside them.
            </p>
          ) : null}
          {paragraphsLoading ? (
            <p className="text-sm text-slate-500">Loading paragraphs…</p>
          ) : null}
          {paragraphsLoadError ? (
            <p className="text-xs text-red-600">{paragraphsLoadError}</p>
          ) : null}
          <CourseContentTablesEditor
            mode="paragraphs"
            paragraphs={paragraphs}
            onParagraphsChange={(next) => {
              setParagraphs(next);
              setContentError('');
            }}
          />
          {contentError ? <p className="text-xs text-red-600">{contentError}</p> : null}
        </>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <p className="text-xs text-slate-400">Step {step + 1} of {STEPS.length}</p>
        <div className="flex gap-3">
          {step === 0 ? (
            onCancel && (
              <button key="cancel" type="button" className="btn-secondary" onClick={onCancel}>
                Cancel
              </button>
            )
          ) : (
            <button key="back" type="button" className="btn-secondary" onClick={goBack} disabled={loading}>
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}
          {isLastStep ? (
            <button key="submit" type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Counsellor'}
            </button>
          ) : (
            <button key="next" type="button" className="btn-primary" onClick={goNext}>
              Next <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
