import SearchableSelect from './SearchableSelect';

export default function CourseSelect({
  courses = [],
  universityId,
  value,
  onChange,
  disabled,
  error,
  placeholder = 'Select course',
  includeUnlinked = false,
}) {
  const filtered = !universityId
    ? []
    : courses.filter((c) => {
      const matchesUniversity =
        String(c.universityId) === String(universityId)
        || String(c.universityUuid) === String(universityId);
      if (matchesUniversity) return true;
      if (includeUnlinked && !c.universityId && !c.universityUuid) return true;
      return false;
    });

  return (
    <SearchableSelect
      options={filtered.map((c) => ({
        id: c.id || c.uuid,
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
