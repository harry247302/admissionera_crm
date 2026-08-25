import SearchableSelect from './SearchableSelect';

export default function UniversitySelect({
  universities = [],
  value,
  onChange,
  disabled,
  error,
  placeholder = 'Select university',
  activeOnly = false,
}) {
  const options = (activeOnly ? universities.filter((u) => u.status === 'ACTIVE') : universities)
    .map((u) => ({
      id: u.id,
      name: u.name,
      code: u.code,
      subtitle: u.code,
    }));

  return (
    <SearchableSelect
      options={options}
      value={value}
      onChange={onChange}
      disabled={disabled}
      error={error}
      placeholder={placeholder}
      searchPlaceholder="Search university name or code..."
    />
  );
}
