import { useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const TOOLBAR = [
  [{ header: [1, 2, 3, 4, false] }],
  [{ size: ['small', false, 'large', 'huge'] }],
  [{ font: [] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ script: 'sub' }, { script: 'super' }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  [{ align: [] }],
  ['blockquote', 'code-block'],
  ['link'],
  ['clean'],
];

const FORMATS = [
  'header',
  'font',
  'size',
  'bold',
  'italic',
  'underline',
  'strike',
  'color',
  'background',
  'script',
  'list',
  'indent',
  'align',
  'blockquote',
  'code-block',
  'link',
];

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Write something...',
  className = '',
  minHeight = 220,
}) {
  const modules = useMemo(() => ({
    toolbar: TOOLBAR,
    clipboard: { matchVisual: false },
  }), []);

  return (
    <div className={`rich-text-editor overflow-hidden rounded-lg border border-slate-200 bg-white ${className}`}>
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={(html) => onChange?.(html === '<p><br></p>' ? '' : html)}
        modules={modules}
        formats={FORMATS}
        placeholder={placeholder}
        style={{ minHeight }}
      />
    </div>
  );
}
