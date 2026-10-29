import { useState, useEffect } from 'react';
import { X, Sparkles, Image as ImageIcon, Link as LinkIcon, Tag, Globe, Calendar, User, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';

export const slugify = (text = '') => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const CATEGORIES = [
  'Education',
  'Admissions',
  'Colleges',
  'Universities',
  'Courses',
  'Career Guidance',
  'Exams & Results',
  'Scholarships',
  'Campus Life',
  'News & Updates',
];

export default function BlogFormModal({
  open,
  onClose,
  onSubmit,
  initialData = null,
  saving = false,
  counselors = [],
}) {
  const isEditing = Boolean(initialData?.uuid || initialData?.id);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    featured_image: '',
    author_id: '',
    category: 'Education',
    customCategory: '',
    tags: [],
    status: 'draft',
    meta_title: '',
    meta_description: '',
    meta_keywords: [],
    published_at: '',
  });

  const [autoSlug, setAutoSlug] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [showSeo, setShowSeo] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      const isCustomCat = initialData.category && !CATEGORIES.includes(initialData.category);
      setFormData({
        title: initialData.title || '',
        slug: initialData.slug || '',
        excerpt: initialData.excerpt || '',
        featured_image: initialData.featured_image || '',
        author_id: initialData.author_id || '',
        category: isCustomCat ? 'Custom' : (initialData.category || 'Education'),
        customCategory: isCustomCat ? initialData.category : '',
        tags: Array.isArray(initialData.tags) ? initialData.tags : [],
        status: initialData.status || 'draft',
        meta_title: initialData.meta_title || '',
        meta_description: initialData.meta_description || '',
        meta_keywords: Array.isArray(initialData.meta_keywords) ? initialData.meta_keywords : [],
        published_at: initialData.published_at ? initialData.published_at.slice(0, 16) : '',
      });
      setAutoSlug(false);
    } else {
      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        featured_image: '',
        author_id: '',
        category: 'Education',
        customCategory: '',
        tags: [],
        status: 'draft',
        meta_title: '',
        meta_description: '',
        meta_keywords: [],
        published_at: '',
      });
      setAutoSlug(true);
    }
    setFormErrors({});
    setImageError(false);
    setTagInput('');
    setKeywordInput('');
  }, [initialData, open]);

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug: autoSlug ? slugify(title) : prev.slug,
      meta_title: prev.meta_title ? prev.meta_title : title,
    }));
    if (formErrors.title) {
      setFormErrors((prev) => ({ ...prev, title: null }));
    }
  };

  const handleSlugChange = (e) => {
    setAutoSlug(false);
    setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }));
    if (formErrors.slug) {
      setFormErrors((prev) => ({ ...prev, slug: null }));
    }
  };

  const handleStatusChange = (e) => {
    const status = e.target.value;
    let published_at = formData.published_at;
    if (status === 'published' && !published_at) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      published_at = now.toISOString().slice(0, 16);
    }
    setFormData((prev) => ({ ...prev, status, published_at }));
  };

  // Tag helpers
  const addTag = () => {
    const val = tagInput.trim().toLowerCase();
    if (val && !formData.tags.includes(val)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, val] }));
      setTagInput('');
    }
  };

  const removeTag = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  // Keyword helpers
  const addKeyword = () => {
    const val = keywordInput.trim().toLowerCase();
    if (val && !formData.meta_keywords.includes(val)) {
      setFormData((prev) => ({ ...prev, meta_keywords: [...prev.meta_keywords, val] }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      meta_keywords: prev.meta_keywords.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleKeywordKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeyword();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.slug.trim()) errors.slug = 'Slug is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const finalCategory =
      formData.category === 'Custom'
        ? formData.customCategory.trim() || 'General'
        : formData.category;

    const payload = {
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      excerpt: formData.excerpt.trim() || null,
      featured_image: formData.featured_image.trim() || null,
      author_id: formData.author_id.trim() || null,
      category: finalCategory || null,
      tags: formData.tags || [],
      status: formData.status || 'draft',
      meta_title: formData.meta_title.trim() || null,
      meta_description: formData.meta_description.trim() || null,
      meta_keywords: formData.meta_keywords || [],
      published_at: formData.published_at ? new Date(formData.published_at).toISOString() : null,
    };

    onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Blog Article' : 'Create New Blog Article'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="label">
                Blog Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Top Engineering Colleges in India 2026"
                value={formData.title}
                onChange={handleTitleChange}
                className={`input ${formErrors.title ? 'border-red-500 focus:ring-red-100' : ''}`}
                required
              />
              {formErrors.title && (
                <p className="mt-1 text-xs text-red-500">{formErrors.title}</p>
              )}
            </div>

            {/* Slug */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="label">
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const generated = slugify(formData.title);
                    setAutoSlug(true);
                    setFormData((prev) => ({ ...prev, slug: generated }));
                  }}
                  className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  <Sparkles className="h-3 w-3" /> Auto-generate from title
                </button>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-mono text-xs text-slate-400">/blogs/</span>
                <input
                  type="text"
                  placeholder="top-engineering-colleges-in-india-2026"
                  value={formData.slug}
                  onChange={handleSlugChange}
                  className={`input pl-16 font-mono text-xs ${
                    formErrors.slug ? 'border-red-500 focus:ring-red-100' : ''
                  }`}
                  required
                />
              </div>
              {formErrors.slug && (
                <p className="mt-1 text-xs text-red-500">{formErrors.slug}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="label">Category</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value }))
                }
                className="input"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Custom">+ Custom Category</option>
              </select>
              {formData.category === 'Custom' && (
                <input
                  type="text"
                  placeholder="Enter custom category"
                  value={formData.customCategory}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customCategory: e.target.value }))
                  }
                  className="input mt-2"
                  required
                />
              )}
            </div>

            {/* Status */}
            <div>
              <label className="label">Publication Status</label>
              <select
                value={formData.status}
                onChange={handleStatusChange}
                className="input"
              >
                <option value="draft">Draft (Unpublished)</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Published At */}
            <div>
              <label className="label flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" /> Published Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.published_at}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, published_at: e.target.value }))
                }
                className="input"
              />
            </div>

            {/* Author */}
            <div>
              <label className="label flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-slate-400" /> Author / Counselor
              </label>
              <select
                value={formData.author_id}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, author_id: e.target.value }))
                }
                className="input"
              >
                <option value="">None / System Author</option>
                {counselors.map((c) => (
                  <option key={c.id || c.uuid} value={c.uuid || c.id}>
                    {c.name || `${c.firstName} ${c.lastName}`.trim()} ({c.designation || 'Counselor'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Featured Image URL */}
          <div>
            <label className="label flex items-center gap-1">
              <ImageIcon className="h-3.5 w-3.5 text-slate-400" /> Featured Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://images.unsplash.com/... or image link"
                value={formData.featured_image}
                onChange={(e) => {
                  setImageError(false);
                  setFormData((prev) => ({ ...prev, featured_image: e.target.value }));
                }}
                className="input flex-1"
              />
              {formData.featured_image && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, featured_image: '' }))}
                  className="btn-secondary px-3"
                  title="Clear image URL"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Live Image Preview */}
            {formData.featured_image && (
              <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2">
                <p className="mb-1 text-xs font-medium text-slate-500">Image Preview:</p>
                {!imageError ? (
                  <img
                    src={formData.featured_image}
                    alt="Preview"
                    onError={() => setImageError(true)}
                    className="h-36 w-full rounded object-cover"
                  />
                ) : (
                  <div className="flex h-20 items-center justify-center gap-2 rounded bg-amber-50 text-xs text-amber-700">
                    <AlertCircle className="h-4 w-4" />
                    Unable to load preview from this URL (check URL format)
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Excerpt / Summary */}
          <div>
            <label className="label">
              Excerpt / Summary
              <span className="ml-1 text-xs font-normal text-slate-400">
                (Brief overview displayed on blog cards and search results)
              </span>
            </label>
            <textarea
              rows={3}
              placeholder="Provide a concise summary of this blog article..."
              value={formData.excerpt}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
              }
              className="input resize-y"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="label flex items-center gap-1">
              <Tag className="h-3.5 w-3.5 text-slate-400" /> Tags
              <span className="ml-1 text-xs font-normal text-slate-400">
                (Type and press Enter or comma)
              </span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
              {formData.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(idx)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder={formData.tags.length === 0 ? 'e.g. admissions, mba, cutoffs' : 'Add tag...'}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={addTag}
                className="flex-1 bg-transparent px-1 text-xs outline-none min-w-[120px]"
              />
            </div>
          </div>
        </div>

        {/* Collapsible SEO Meta Settings */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
          <button
            type="button"
            onClick={() => setShowSeo(!showSeo)}
            className="flex w-full items-center justify-between text-left text-sm font-semibold text-slate-800"
          >
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-brand-600" /> SEO & Meta Tags
              <span className="rounded bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                Optional
              </span>
            </span>
            <span className="text-xs text-brand-600 hover:underline">
              {showSeo ? 'Hide SEO fields' : 'Configure SEO fields'}
            </span>
          </button>

          {showSeo && (
            <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="label">Meta Title</label>
                  <span className="text-xs text-slate-400">
                    {formData.meta_title.length} / 60 chars
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="SEO Title for search engines"
                  value={formData.meta_title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, meta_title: e.target.value }))
                  }
                  className="input text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="label">Meta Description</label>
                  <span className="text-xs text-slate-400">
                    {formData.meta_description.length} / 160 chars
                  </span>
                </div>
                <textarea
                  rows={2}
                  placeholder="Meta description for search engine snippets"
                  value={formData.meta_description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, meta_description: e.target.value }))
                  }
                  className="input resize-y text-sm"
                />
              </div>

              <div>
                <label className="label">
                  Meta Keywords
                  <span className="ml-1 text-xs font-normal text-slate-400">
                    (Type keyword and press Enter or comma)
                  </span>
                </label>
                <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
                  {formData.meta_keywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
                    >
                      {kw}
                      <button
                        type="button"
                        onClick={() => removeKeyword(idx)}
                        className="text-brand-400 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={
                      formData.meta_keywords.length === 0
                        ? 'e.g. best colleges, direct admission'
                        : 'Add keyword...'
                    }
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    onBlur={addKeyword}
                    className="flex-1 bg-transparent px-1 text-xs outline-none min-w-[120px]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary min-w-[110px]"
            disabled={saving}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </span>
            ) : isEditing ? (
              'Save Changes'
            ) : (
              'Create Blog'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

