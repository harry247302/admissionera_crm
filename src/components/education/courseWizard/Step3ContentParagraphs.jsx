import CourseContentTablesEditor from './CourseContentTablesEditor';

export default function Step3ContentParagraphs({
  contentParagraphs = [],
  onContentParagraphsChange,
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Content Paragraphs</h3>
        <p className="mt-1 text-sm text-slate-500">
          Optional. Add text blocks like overview, eligibility, or highlights.
        </p>
      </div>
      <CourseContentTablesEditor
        mode="paragraphs"
        paragraphs={contentParagraphs}
        onParagraphsChange={onContentParagraphsChange}
      />
    </div>
  );
}
