import { Controller } from 'react-hook-form';
import FormField from '../FormField';
import UniversitySelect from '../UniversitySelect';
import {
  COURSE_LEVELS, CURRENCIES, ENTITY_STATUSES, formatLabel,
} from '../../../utils/educationConstants';

export default function Step1CourseDetails({
  register, control, errors, universities, isEditing,
}) {
  return (
    <div className="space-y-5">
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
              activeOnly={!isEditing}
              disabled={isEditing}
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
        <FormField label="Degree">
          <input className="input" placeholder="e.g. MBA" {...register('degree')} />
        </FormField>
        <FormField label="Course Level *" error={errors.level?.message}>
          <select className="input" {...register('level', { required: 'Course level is required' })}>
            <option value="">Select level</option>
            {COURSE_LEVELS.map((level) => <option key={level} value={level}>{formatLabel(level)}</option>)}
          </select>
        </FormField>
        <FormField label="Department">
          <input className="input" placeholder="e.g. Computer Science" {...register('department')} />
        </FormField>
        <FormField label="Faculty">
          <input className="input" placeholder="e.g. Faculty of Engineering" {...register('faculty')} />
        </FormField>
        <FormField label="Study Mode">
          <input className="input" placeholder="e.g. Full Time" {...register('studyMode')} />
        </FormField>
        <FormField label="Attendance Mode">
          <input className="input" placeholder="e.g. On Campus" {...register('attendanceMode')} />
        </FormField>
        <FormField label="Language">
          <input className="input" placeholder="e.g. English" {...register('language')} />
        </FormField>
        <FormField label="Currency">
          <select className="input" {...register('currency')}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
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
      <FormField label="Overview">
        <textarea className="input min-h-[80px]" rows={3} {...register('overview')} />
      </FormField>
      <FormField label="Eligibility">
        <textarea className="input min-h-[80px]" rows={3} placeholder="Minimum qualification and entrance requirements" {...register('eligibility')} />
      </FormField>
      <FormField label="Curriculum">
        <textarea className="input min-h-[80px]" rows={3} {...register('curriculum')} />
      </FormField>
      <FormField label="Career Opportunities">
        <textarea className="input min-h-[80px]" rows={3} {...register('careerOpportunities')} />
      </FormField>
    </div>
  );
}
