import CourseContentTablesEditor from './CourseContentTablesEditor';

export default function Step2ContentTables({
  contentTables = [],
  onContentTablesChange,
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Content Tables</h3>
        <p className="mt-1 text-sm text-slate-500">
          Optional. Add structured tables for curriculum, subjects, or fee notes.
        </p>
      </div>
      <CourseContentTablesEditor
        mode="tables"
        value={contentTables}
        onChange={onContentTablesChange}
      />
    </div>
  );
}
