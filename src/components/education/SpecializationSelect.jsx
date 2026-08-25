import SearchableSelect from './SearchableSelect';

export default function SpecializationSelect({
  specializations = [],
  courseId,
  value,
  onChange,
  disabled,
  error,
  placeholder = 'Select specialization',
}) {
  const filtered = courseId
    ? specializations.filter((s) => String(s.courseId) === String(courseId))
    : [];

  return (
    <SearchableSelect
      options={filtered.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        subtitle: s.code,
      }))}
      value={value}
      onChange={onChange}
      disabled={disabled || !courseId}
      error={error}
      placeholder={courseId ? placeholder : 'Select a course first'}
      searchPlaceholder="Search specialization..."
    />
  );
}
