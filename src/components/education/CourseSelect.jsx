import SearchableSelect from './SearchableSelect';

export default function CourseSelect({
  courses = [],
  universityId,
  value,
  onChange,
  disabled,
  error,
  placeholder = 'Select course',
}) {
  const filtered = universityId
    ? courses.filter((c) => String(c.universityId) === String(universityId))
    : [];

  return (
    <SearchableSelect
      options={filtered.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        subtitle: c.code,
      }))}
      value={value}
      onChange={onChange}
      disabled={disabled || !universityId}
      error={error}
      placeholder={universityId ? placeholder : 'Select a university first'}
      searchPlaceholder="Search course name or code..."
    />
  );
}
