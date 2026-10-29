import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  BookOpen,
  GraduationCap,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  Archive,
  Tag,
  Globe,
  SlidersHorizontal,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  fetchBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
} from '../../redux/slices/blogSlice';
import { fetchAdmissions } from '../../redux/slices/applicationSlice';
import { fetchCounselors } from '../../redux/slices/counselorSlice';

import BlogFormModal from '../../components/crm/BlogFormModal';
import BlogDetailModal from '../../components/crm/BlogDetailModal';
import { ConfirmDialog } from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/crmConstants';

function formatBlogDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Admissions() {
  const dispatch = useDispatch();

  // Redux state
  const { items: blogs, loading: blogsLoading, saving: blogSaving } = useSelector(
    (s) => s.blogs
  );
  const { admissions, admissionsLoading } = useSelector((s) => s.applications);
  const { items: counselors } = useSelector((s) => s.counselors);

  // Active top-level Tab: 'blogs' | 'admissions'
  const [activeTab, setActiveTab] = useState('blogs');

  // Filter & Search state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initial load
  useEffect(() => {
    dispatch(fetchBlogs());
    dispatch(fetchAdmissions());
    dispatch(fetchCounselors());
  }, [dispatch]);

  // Counselor lookup map for author names
  const counselorMap = useMemo(() => {
    const map = {};
    counselors.forEach((c) => {
      const key = c.uuid || c.id;
      if (key) map[key] = c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim();
    });
    return map;
  }, [counselors]);

  // Unique categories list
  const categories = useMemo(() => {
    const set = new Set();
    blogs.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [blogs]);

  // Filtered & sorted blogs
  const filteredBlogs = useMemo(() => {
    let result = [...blogs];

    // Search query
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((b) => {
        const titleMatch = (b.title || '').toLowerCase().includes(q);
        const slugMatch = (b.slug || '').toLowerCase().includes(q);
        const excerptMatch = (b.excerpt || '').toLowerCase().includes(q);
        const catMatch = (b.category || '').toLowerCase().includes(q);
        const tagsMatch = Array.isArray(b.tags) && b.tags.some((t) => t.toLowerCase().includes(q));
        return titleMatch || slugMatch || excerptMatch || catMatch || tagsMatch;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((b) => b.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((b) => b.category === categoryFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at || b.published_at || 0) - new Date(a.created_at || a.published_at || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at || a.published_at || 0) - new Date(b.created_at || b.published_at || 0);
      }
      if (sortBy === 'title-asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'title-desc') {
        return (b.title || '').localeCompare(a.title || '');
      }
      return 0;
    });

    return result;
  }, [blogs, search, statusFilter, categoryFilter, sortBy]);

  // KPI counts
  const stats = useMemo(() => {
    const total = blogs.length;
    const published = blogs.filter((b) => b.status === 'published').length;
    const drafts = blogs.filter((b) => b.status === 'draft').length;
    const uniqueCats = categories.length;
    return { total, published, drafts, categories: uniqueCats };
  }, [blogs, categories]);

  // Handlers
  const handleOpenCreate = () => {
    setEditingBlog(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (blog) => {
    setEditingBlog(blog);
    setFormModalOpen(true);
  };

  const handleOpenDetail = (blog) => {
    setSelectedBlog(blog);
    setDetailModalOpen(true);
  };

  const handleOpenDelete = (blog) => {
    setBlogToDelete(blog);
    setDeleteConfirmOpen(true);
  };

  const handleFormSubmit = async (payload) => {
    try {
      if (editingBlog?.uuid) {
        await dispatch(updateBlog({ uuid: editingBlog.uuid, data: payload })).unwrap();
        toast.success('Blog updated successfully');
      } else {
        await dispatch(createBlog(payload)).unwrap();
        toast.success('Blog created successfully');
      }
      setFormModalOpen(false);
      setEditingBlog(null);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Operation failed');
    }
  };

  const handleConfirmDelete = async () => {
    if (!blogToDelete?.uuid) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteBlog(blogToDelete.uuid)).unwrap();
      toast.success('Blog deleted successfully');
      setDeleteConfirmOpen(false);
      setBlogToDelete(null);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to delete blog');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'blogs') {
      dispatch(fetchBlogs());
      toast.success('Refreshed blogs');
    } else {
      dispatch(fetchAdmissions());
      toast.success('Refreshed admissions');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {activeTab === 'blogs' ? 'Blog Management' : 'Admissions Records'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {activeTab === 'blogs'
              ? 'Publish, organize, and manage articles, announcements, and guides'
              : 'Track student admissions, assigned counselors, and revenue'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Top Tabs */}
          <div className="flex rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => setActiveTab('blogs')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'blogs'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Blogs ({blogs.length})
            </button>
            <button
              onClick={() => setActiveTab('admissions')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'admissions'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Admissions ({admissions.length})
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="btn-secondary px-3"
            title="Refresh"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                (activeTab === 'blogs' ? blogsLoading : admissionsLoading)
                  ? 'animate-spin text-brand-600'
                  : 'text-slate-600'
              }`}
            />
          </button>

          {activeTab === 'blogs' && (
            <button onClick={handleOpenCreate} className="btn-primary">
              <Plus className="h-4 w-4" />
              <span>Create Blog</span>
            </button>
          )}
        </div>
      </div>

      {/* BLOGS VIEW */}
      {activeTab === 'blogs' && (
        <div className="space-y-6">
          {/* Metrics Banner */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="card p-4">
              <p className="text-xs font-medium text-slate-500">Total Articles</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="card p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Published
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.published}</p>
            </div>
            <div className="card p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Drafts
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-700">{stats.drafts}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-medium text-slate-500">Categories</p>
              <p className="mt-1 text-2xl font-bold text-brand-700">{stats.categories}</p>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="card space-y-3 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search articles by title, slug, excerpt, tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-9 text-sm"
                />
              </div>

              {/* Filters & View Switches */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-brand-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-brand-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-brand-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title-asc">Title (A-Z)</option>
                  <option value="title-desc">Title (Z-A)</option>
                </select>

                {/* Grid / Table Toggle */}
                <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`rounded p-1.5 transition-colors ${
                      viewMode === 'table' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500'
                    }`}
                    title="Table View"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`rounded p-1.5 transition-colors ${
                      viewMode === 'grid' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500'
                    }`}
                    title="Grid Card View"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Pill display */}
            {(search || statusFilter !== 'all' || categoryFilter !== 'all') && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">Active filters:</span>
                {search && (
                  <span className="rounded bg-brand-50 px-2 py-0.5 text-brand-700">
                    Query: "{search}"
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 capitalize">
                    Status: {statusFilter}
                  </span>
                )}
                {categoryFilter !== 'all' && (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">
                    Category: {categoryFilter}
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setCategoryFilter('all');
                  }}
                  className="font-medium text-brand-600 hover:underline ml-1"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Content Area */}
          {blogsLoading && blogs.length === 0 ? (
            <div className="card py-16">
              <LoadingSpinner />
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="card">
              <EmptyState
                title={blogs.length === 0 ? 'No blogs found' : 'No matching blogs'}
                description={
                  blogs.length === 0
                    ? 'Start publishing articles by creating your first blog post.'
                    : 'Try clearing your search query or adjusting your filters.'
                }
                action={
                  blogs.length === 0 ? (
                    <button onClick={handleOpenCreate} className="btn-primary">
                      <Plus className="h-4 w-4" /> Create First Blog
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSearch('');
                        setStatusFilter('all');
                        setCategoryFilter('all');
                      }}
                      className="btn-secondary"
                    >
                      Reset Filters
                    </button>
                  )
                }
              />
            </div>
          ) : viewMode === 'table' ? (
            /* Table View */
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="py-3.5 px-4">Article</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Tags</th>
                      <th className="py-3.5 px-4">Published Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBlogs.map((blog) => {
                      const isPub = blog.status === 'published';
                      const isDraft = blog.status === 'draft';

                      return (
                        <tr
                          key={blog.uuid}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          {/* Title & Thumbnail */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3 min-w-[260px]">
                              {blog.featured_image ? (
                                <img
                                  src={blog.featured_image}
                                  alt=""
                                  className="h-12 w-14 rounded-md object-cover border border-slate-200 bg-slate-100 shrink-0"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400">
                                  <BookOpen className="h-5 w-5" />
                                </div>
                              )}
                              <div className="space-y-0.5">
                                <button
                                  onClick={() => handleOpenDetail(blog)}
                                  className="font-semibold text-slate-900 hover:text-brand-600 line-clamp-1 text-left"
                                >
                                  {blog.title}
                                </button>
                                <p className="font-mono text-xs text-slate-400">
                                  /blogs/{blog.slug}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                              {blog.category || 'General'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                isPub
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isDraft
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isPub ? 'bg-emerald-500' : isDraft ? 'bg-amber-500' : 'bg-slate-400'
                                }`}
                              />
                              <span className="capitalize">{blog.status || 'draft'}</span>
                            </span>
                          </td>

                          {/* Tags */}
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {Array.isArray(blog.tags) && blog.tags.length > 0 ? (
                                blog.tags.slice(0, 2).map((t, i) => (
                                  <span
                                    key={i}
                                    className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600"
                                  >
                                    #{t}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                              {Array.isArray(blog.tags) && blog.tags.length > 2 && (
                                <span className="text-[11px] text-slate-400">
                                  +{blog.tags.length - 2}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-500">
                            {formatBlogDate(blog.published_at || blog.created_at)}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleOpenDetail(blog)}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(blog)}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-brand-50 hover:text-brand-600"
                                title="Edit Blog"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleOpenDelete(blog)}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                                title="Delete Blog"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Grid / Card View */
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredBlogs.map((blog) => {
                const isPub = blog.status === 'published';
                const isDraft = blog.status === 'draft';

                return (
                  <div
                    key={blog.uuid}
                    className="card flex flex-col justify-between overflow-hidden p-0 transition-all hover:shadow-md"
                  >
                    <div>
                      {/* Image header */}
                      <div className="relative h-44 w-full bg-slate-100">
                        {blog.featured_image ? (
                          <img
                            src={blog.featured_image}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <BookOpen className="h-10 w-10" />
                          </div>
                        )}
                        <span
                          className={`absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm shadow-sm ${
                            isPub
                              ? 'bg-emerald-600/90 text-white'
                              : isDraft
                              ? 'bg-amber-600/90 text-white'
                              : 'bg-slate-700/90 text-white'
                          }`}
                        >
                          <span className="capitalize">{blog.status || 'draft'}</span>
                        </span>

                        {blog.category && (
                          <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-sm">
                            {blog.category}
                          </span>
                        )}
                      </div>

                      {/* Body */}
                      <div className="p-4 space-y-2">
                        <button
                          onClick={() => handleOpenDetail(blog)}
                          className="font-bold text-slate-900 hover:text-brand-600 line-clamp-2 text-left"
                        >
                          {blog.title}
                        </button>

                        <p className="font-mono text-xs text-slate-400">/blogs/{blog.slug}</p>

                        {blog.excerpt && (
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {blog.excerpt}
                          </p>
                        )}

                        {/* Tags */}
                        {Array.isArray(blog.tags) && blog.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {blog.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                              >
                                #{tag}
                              </span>
                            ))}
                            {blog.tags.length > 3 && (
                              <span className="text-[11px] text-slate-400 self-center">
                                +{blog.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-500">
                      <span>{formatBlogDate(blog.published_at || blog.created_at)}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenDetail(blog)}
                          className="rounded p-1 hover:bg-white hover:text-slate-900"
                          title="Preview Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(blog)}
                          className="rounded p-1 hover:bg-brand-50 hover:text-brand-600"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(blog)}
                          className="rounded p-1 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ADMISSIONS VIEW */}
      {activeTab === 'admissions' && (
        <div className="space-y-4">
          {admissionsLoading ? (
            <div className="card py-16">
              <LoadingSpinner />
            </div>
          ) : admissions.length === 0 ? (
            <div className="card">
              <EmptyState
                title="No admissions yet"
                description="Convert leads and track admission student records here."
              />
            </div>
          ) : (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="py-3 px-4">Admission ID</th>
                      <th className="py-3 px-4">Lead</th>
                      <th className="py-3 px-4">University</th>
                      <th className="py-3 px-4">Course</th>
                      <th className="py-3 px-4">Counselor</th>
                      <th className="py-3 px-4">Revenue</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {admissions.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs">{a.admissionCode}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{a.leadName}</td>
                        <td className="py-3 px-4 text-slate-600">{a.university || '—'}</td>
                        <td className="py-3 px-4 text-slate-600">{a.course || '—'}</td>
                        <td className="py-3 px-4 text-slate-600">{a.counselorName || '—'}</td>
                        <td className="py-3 px-4 font-medium text-emerald-700">
                          ₹{Number(a.revenue || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{formatDate(a.admissionDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Blog Create / Edit Modal */}
      <BlogFormModal
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingBlog(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingBlog}
        saving={blogSaving}
        counselors={counselors}
      />

      {/* Blog Detail / Preview Modal */}
      <BlogDetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedBlog(null);
        }}
        blog={selectedBlog}
        onEdit={(blog) => handleOpenEdit(blog)}
        onDelete={(blog) => handleOpenDelete(blog)}
        counselorMap={counselorMap}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => {
          if (!isDeleting) {
            setDeleteConfirmOpen(false);
            setBlogToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Blog Article"
        message={
          blogToDelete
            ? `Are you sure you want to permanently delete "${blogToDelete.title}"? This action cannot be undone.`
            : 'Are you sure you want to delete this blog?'
        }
        confirmText={isDeleting ? 'Deleting...' : 'Delete Blog'}
        danger
      />
    </div>
  );
}
