import FormField from '../FormField';
import CourseContentTablesEditor from './CourseContentTablesEditor';
import {
  ATTENDANCE_MODES,
  COURSE_LEVELS,
  CURRENCIES,
  ENTITY_STATUSES,
  STUDY_MODES,
  formatLabel,
} from '../../../utils/educationConstants';

export default function Step1CourseDetails({
  register,
  errors,
  contentTables = [],
  onContentTablesChange,
  contentParagraphs = [],
  onContentParagraphsChange,
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Course Name *" error={errors.name?.message}>
          <input
            className="input"
            placeholder="e.g. Master of Business Administration"
            {...register('name', { required: 'Course name is required' })}
          />
        </FormField>
        <FormField label="Course Code *" error={errors.code?.message}>
          <input
            className="input uppercase"
            placeholder="e.g. MBA"
            {...register('code', { required: 'Course code is required' })}
          />
        </FormField>
        <FormField label="Degree">
          <input className="input" placeholder="e.g. MBA" {...register('degree')} />
        </FormField>
        <FormField label="Course Level *" error={errors.level?.message}>
          <select className="input" {...register('level', { required: 'Course level is required' })}>
            <option value="">Select level</option>
            {COURSE_LEVELS.map((level) => (
              <option key={level} value={level}>{formatLabel(level)}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Department">
          <input className="input" placeholder="e.g. Business School" {...register('department')} />
        </FormField>
        <FormField label="Study Mode">
          <select className="input" {...register('studyMode')}>
            <option value="">Select study mode</option>
            {STUDY_MODES.map((mode) => (
              <option key={mode} value={mode}>{formatLabel(mode)}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Attendance Mode">
          <select className="input" {...register('attendanceMode')}>
            <option value="">Select attendance</option>
            {ATTENDANCE_MODES.map((mode) => (
              <option key={mode} value={mode}>{formatLabel(mode)}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Language">
          <input className="input" placeholder="e.g. English" {...register('language')} />
        </FormField>
        <FormField label="Currency">
          <select className="input" {...register('currency')}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Status">
          <select className="input" {...register('status')}>
            {ENTITY_STATUSES.map((s) => (
              <option key={s} value={s}>{formatLabel(s)}</option>
            ))}
          </select>
        </FormField>
      </div>

      <CourseContentTablesEditor
        value={contentTables}
        onChange={onContentTablesChange}
        paragraphs={contentParagraphs}
        onParagraphsChange={onContentParagraphsChange}
      />
    </div>
  );
}
