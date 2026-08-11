import { useForm } from 'react-hook-form';
import { LEAD_SOURCES, PRIORITIES } from '../../utils/crmConstants';

export default function LeadForm({ defaultValues, counselors = [], onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full Name *" error={errors.fullName?.message}>
          <input className="input" {...register('fullName', { required: 'Required' })} />
        </Field>
        <Field label="Phone *" error={errors.phone?.message}>
          <input className="input" {...register('phone', { required: 'Required' })} />
        </Field>
        <Field label="Email">
          <input type="email" className="input" {...register('email')} />
        </Field>
        <Field label="WhatsApp Number">
          <input className="input" {...register('whatsappNumber')} />
        </Field>
        <Field label="Date of Birth">
          <input type="date" className="input" {...register('dateOfBirth')} />
        </Field>
        <Field label="Gender">
          <select className="input" {...register('gender')}>
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </Field>
        <Field label="City">
          <input className="input" {...register('city')} />
        </Field>
        <Field label="State">
          <input className="input" {...register('state')} />
        </Field>
        <Field label="Course">
          <input className="input" {...register('course')} />
        </Field>
        <Field label="University">
          <input className="input" {...register('university')} />
        </Field>
        <Field label="Specialization">
          <input className="input" {...register('specialization')} />
        </Field>
        <Field label="Academic Qualification">
          <input className="input" {...register('academicQualification')} />
        </Field>
        <Field label="Passing Year">
          <input type="number" className="input" {...register('passingYear')} />
        </Field>
        <Field label="Percentage/CGPA">
          <input className="input" {...register('percentageCgpa')} />
        </Field>
        <Field label="Preferred Location">
          <input className="input" {...register('preferredLocation')} />
        </Field>
        <Field label="Budget">
          <input type="number" className="input" {...register('budget')} />
        </Field>
        <Field label="Lead Source *">
          <select className="input" {...register('leadSource', { required: 'Required' })}>
            {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </Field>
        <Field label="Lead Campaign">
          <input className="input" {...register('leadCampaign')} />
        </Field>
        <Field label="Assigned Counselor">
          <select className="input" {...register('assignedCounselorId')}>
            <option value="">Unassigned</option>
            {counselors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Priority">
          <select className="input" {...register('priority')}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Notes">
        <textarea className="input min-h-[80px]" {...register('notes')} />
      </Field>
      <div className="flex justify-end gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Lead'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
