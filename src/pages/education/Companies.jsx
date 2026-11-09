import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Globe,
  ExternalLink,
  LayoutGrid,
  List,
  CheckCircle2,
  Eye,
  Edit2,
  Trash2,
  X,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  fetchCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  setCompanySearch,
} from '../../redux/slices/companySlice';

import Breadcrumb from '../../components/education/Breadcrumb';
import CompanyFormModal from '../../components/education/CompanyFormModal';
import CompanyDetailsModal from '../../components/education/CompanyDetailsModal';
import { ConfirmDialog } from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function Companies() {
  const dispatch = useDispatch();
  const { items: companies, loading, saving, search } = useSelector(
    (s) => s.companies
  );

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'with-website' | 'with-logo'

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchCompanies())
      .unwrap()
      .then(() => toast.success('Companies catalogue refreshed'))
      .catch((err) => toast.error(err || 'Failed to refresh companies'));
  };

  const handleOpenCreate = () => {
    setEditingCompany(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (comp) => {
    setEditingCompany(comp);
    setFormModalOpen(true);
  };

  const handleSaveCompany = async (payload) => {
    try {
      if (editingCompany) {
        const id = editingCompany.id || editingCompany.uuid;
        await dispatch(updateCompany({ id, data: payload })).unwrap();
        toast.success('Company updated successfully!');
      } else {
        await dispatch(createCompany(payload)).unwrap();
        toast.success('Company created successfully!');
      }
      setFormModalOpen(false);
      setEditingCompany(null);
      dispatch(fetchCompanies());
    } catch (err) {
      toast.error(
        typeof err === 'string'
          ? err
          : err?.message || (editingCompany ? 'Failed to update company' : 'Failed to create company')
      );
    }
  };

  const handleDeletePrompt = (comp) => {
    setDeleteTarget(comp);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id || deleteTarget.uuid;

    try {
      await dispatch(deleteCompany(id)).unwrap();
      toast.success('Company deleted successfully');
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      dispatch(fetchCompanies());
    } catch (err) {
      toast.error(
        typeof err === 'string'
          ? err
          : err?.message || 'Failed to delete company'
      );
    }
  };

  const handleViewDetails = (company) => {
    setSelectedCompany(company);
    setDetailModalOpen(true);
  };

  // Filtered companies based on search and pills
  const filteredCompanies = useMemo(() => {
    const q = (search || '').trim().toLowerCase();

    return companies.filter((comp) => {
      const name = (comp?.company_name || comp?.name || '').toLowerCase();
      const web = (comp?.website || '').toLowerCase();

      // Search match
      const matchesSearch = !q || name.includes(q) || web.includes(q);
      if (!matchesSearch) return false;

      // Filter pill match
      if (filterType === 'with-website') {
        return Boolean(comp?.website);
      }
      if (filterType === 'with-logo') {
        return Boolean(comp?.logo);
      }

      return true;
    });
  }, [companies, search, filterType]);

  // Statistics
  const stats = useMemo(() => {
    const total = companies.length;
    const withWebsite = companies.filter((c) => Boolean(c.website)).length;
    const withLogo = companies.filter((c) => Boolean(c.logo)).length;
    return { total, withWebsite, withLogo };
  }, [companies]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Breadcrumb
            items={[
              { label: 'Education', to: '/crm/education' },
              { label: 'Companies & Partners' },
            ]}
          />
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Companies &amp; Hiring Partners
            </h1>
            <span className="rounded-full bg-brand-50 px-3 py-0.5 text-xs font-semibold text-brand-700">
              {stats.total} total
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Catalog of recruiting companies, placement partners, and corporate associates for universities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="btn-secondary"
            title="Refresh catalogue"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? 'animate-spin text-brand-600' : ''}`}
            />
          </button>
          <button
            onClick={handleOpenCreate}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" /> Add Company
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Companies
            </p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.total}</h3>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              With Website
            </p>
            <h3 className="text-2xl font-bold text-slate-900">
              {stats.withWebsite}
            </h3>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              With Verified Logo
            </p>
            <h3 className="text-2xl font-bold text-slate-900">
              {stats.withLogo}
            </h3>
          </div>
        </div>
      </div>

      {/* Search & Toolbar */}
      <div className="card space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search companies by name or website domain (e.g. Google, TCS, Infosys)..."
              value={search}
              onChange={(e) => dispatch(setCompanySearch(e.target.value))}
              className="input pl-9 pr-9"
            />
            {search && (
              <button
                onClick={() => dispatch(setCompanySearch(''))}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Pills & View Mode */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                onClick={() => setFilterType('all')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({companies.length})
              </button>
              <button
                onClick={() => setFilterType('with-website')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  filterType === 'with-website'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Website ({stats.withWebsite})
              </button>
              <button
                onClick={() => setFilterType('with-logo')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  filterType === 'with-logo'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Logo ({stats.withLogo})
              </button>
            </div>

            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-brand-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-brand-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {search && (
          <p className="text-xs text-slate-500">
            Showing {filteredCompanies.length} result
            {filteredCompanies.length === 1 ? '' : 's'} for &quot;{search}&quot;
          </p>
        )}
      </div>

      {/* Main Content Area */}
      {loading && companies.length === 0 ? (
        <LoadingSpinner message="Loading partner companies catalog..." />
      ) : filteredCompanies.length === 0 ? (
        <EmptyState
          title={search ? 'No matching companies found' : 'No companies added yet'}
          description={
            search
              ? `No companies matched your query "${search}". Try another keyword or clear the search.`
              : 'Start by adding corporate partners and recruiting companies that hire from universities.'
          }
          action={
            search ? (
              <button
                onClick={() => dispatch(setCompanySearch(''))}
                className="btn-secondary"
              >
                Clear Search
              </button>
            ) : (
              <button
                onClick={handleOpenCreate}
                className="btn-primary"
              >
                <Plus className="h-4 w-4" /> Add First Company
              </button>
            )
          }
        />
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredCompanies.map((comp, idx) => {
            const name = comp.company_name || comp.name || 'Unnamed Company';
            const web = comp.website;
            const logo = comp.logo;

            return (
              <div
                key={comp.id || comp.uuid || `${name}-${idx}`}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-brand-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-2 group-hover:bg-brand-50/40 transition-colors">
                      {logo ? (
                        <img
                          src={logo}
                          alt={name}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                          className="h-full w-full object-contain"
                        />
                      ) : null}
                      <span
                        className={`${logo ? 'hidden' : 'flex'} h-full w-full items-center justify-center text-sm font-bold text-slate-500`}
                      >
                        {name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>

                    {/* Card Top Actions: View, Edit, Delete */}
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleViewDetails(comp)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(comp)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                        title="Edit Company"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePrompt(comp)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete Company"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="mt-3 font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {name}
                  </h3>

                  {web ? (
                    <a
                      href={web.startsWith('http') ? web : `https://${web}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-600 hover:underline"
                    >
                      <Globe className="h-3 w-3" />
                      <span className="truncate max-w-[180px]">
                        {web.replace(/^https?:\/\//i, '').replace(/\/$/, '')}
                      </span>
                      <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                    </a>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400 italic">
                      No website linked
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> Partner
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(comp)}
                      className="text-xs font-medium text-slate-500 hover:text-brand-600 transition-colors"
                    >
                      Edit
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      onClick={() => handleViewDetails(comp)}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      View Info
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Logo</th>
                  <th className="px-4 py-3">Company Name</th>
                  <th className="px-4 py-3">Website</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCompanies.map((comp, idx) => {
                  const name = comp.company_name || comp.name || 'Unnamed Company';
                  const web = comp.website;
                  const logo = comp.logo;

                  return (
                    <tr
                      key={comp.id || comp.uuid || `${name}-${idx}`}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1">
                          {logo ? (
                            <img
                              src={logo}
                              alt={name}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                              className="h-full w-full object-contain"
                            />
                          ) : null}
                          <span
                            className={`${logo ? 'hidden' : 'flex'} text-xs font-bold text-slate-500`}
                          >
                            {name.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{name}</div>
                      </td>
                      <td className="px-4 py-3">
                        {web ? (
                          <a
                            href={web.startsWith('http') ? web : `https://${web}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:underline"
                          >
                            <Globe className="h-3.5 w-3.5 text-slate-400" />
                            {web.replace(/^https?:\/\//i, '').replace(/\/$/, '')}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> Active Partner
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewDetails(comp)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            title="View Profile"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                          <button
                            onClick={() => handleOpenEdit(comp)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 hover:border-brand-300 transition-colors"
                            title="Edit Company"
                          >
                            <Edit2 className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeletePrompt(comp)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                            title="Delete Company"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
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
      )}

      {/* Creation / Edit Modal */}
      <CompanyFormModal
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingCompany(null);
        }}
        onSubmit={handleSaveCompany}
        initialData={editingCompany}
        saving={saving}
      />

      {/* Details Modal */}
      <CompanyDetailsModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        company={selectedCompany}
        onEdit={(comp) => handleOpenEdit(comp)}
        onDelete={(comp) => handleDeletePrompt(comp)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Company"
        message={`Are you sure you want to delete "${
          deleteTarget?.company_name || deleteTarget?.name || 'this company'
        }"? This will remove the company from the global partner catalog.`}
        confirmText={saving ? 'Deleting...' : 'Delete Company'}
        danger
      />
    </div>
  );
}
