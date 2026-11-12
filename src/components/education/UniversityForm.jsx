import { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ChevronDown, ChevronUp, Search, X, ExternalLink, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import FormField from './FormField';
import RichTextEditor from '../common/RichTextEditor';
import Step2ContentTables from './courseWizard/Step2ContentTables';
import Step3ContentParagraphs from './courseWizard/Step3ContentParagraphs';
import WizardStepIndicator from './courseWizard/WizardStepIndicator';
import {
  UNIVERSITY_FORM_STEPS,
  UNIVERSITY_STEP1_FIELDS,
} from './courseWizard/courseWizardUtils';
import {
  emptyContentParagraphs,
  emptyContentTables,
  mapApiParagraphsToEditor,
  mapApiTablesToEditor,
} from './courseWizard/CourseContentTablesEditor';
import { universityContentTableService } from '../../services/educationService';
import { UNIVERSITY_TYPES, ENTITY_STATUSES, formatLabel } from '../../utils/educationConstants';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ASSET_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

const resolveAssetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path) || path.startsWith('blob:')) return path;
  return `${ASSET_BASE}${path.startsWith('/') ? path : `/${path}`}`;
};

const formatApprovalLabel = (approval) => {
  if (typeof approval === 'object' && approval !== null) {
    return approval.approval_name || approval.name || approval.title || 'Approval';
  }
  if (typeof approval === 'string') {
    let name = approval.replace(/\.[^/.]+$/, '');
    name = name.replace(/^logo[-_]|[-_]logo$/gi, '');
    name = name.replace(/[-_]a[-_]plus[-_]plus/gi, ' A++');
    name = name.replace(/[-_]a[-_]plus/gi, ' A+');
    name = name.replace(/[-_]/g, ' ').trim();
    return name.toUpperCase();
  }
  return String(approval);
};

const getApprovalKey = (item) => {
  if (item == null) return '';
  if (typeof item === 'string') return item.trim();
  return (
    item.approval_logo ||
    item.logo ||
    item.approval_name ||
    item.name ||
    item.title ||
    item.id ||
    item.uuid ||
    ''
  ).toString().trim();
};

const normalizeApprovalName = (str) => {
  if (!str) return '';
  let s = String(str).split('/').pop() || '';
  s = s.replace(/\.[^/.]+$/, '');
  s = s.replace(/^logo[-_]|[-_]logo$/gi, '');
  s = s.replace(/[-_]a[-_]plus[-_]plus/gi, ' a++');
  s = s.replace(/[-_]a[-_]plus/gi, ' a+');
  s = s.replace(/[-_]/g, ' ').trim().toLowerCase();
  return s;
};

const isApprovalMatch = (a, b) => {
  if (!a || !b) return false;
  const keyA = getApprovalKey(a);
  const keyB = getApprovalKey(b);
  if (keyA && keyB && keyA.toLowerCase() === keyB.toLowerCase()) return true;

  const normA = normalizeApprovalName(keyA);
  const normB = normalizeApprovalName(keyB);
  if (normA && normB) {
    if (normA === normB) return true;
    const wordsA = normA.split(' ').filter(Boolean);
    const wordsB = normB.split(' ').filter(Boolean);
    if (wordsA.length && wordsB.length) {
      if (wordsA.some((w) => w.length >= 3 && wordsB.includes(w))) return true;
    }
  }
  return false;
};

const isApprovalSelected = (approval, list = []) => {
  return list.some((item) => isApprovalMatch(item, approval));
};

const getCompanyKey = (company) => {
  if (company == null) return '';
  if (typeof company === 'string') return company.trim();
  return (
    company.company_name ||
    company.name ||
    company.title ||
    company.id ||
    company.uuid ||
    ''
  ).toString().trim();
};

const isCompanyMatch = (a, b) => {
  if (!a || !b) return false;
  const keyA = getCompanyKey(a).toLowerCase();
  const keyB = getCompanyKey(b).toLowerCase();
  return keyA === keyB;
};

const isCompanySelected = (company, list = []) => {
  return list.some((item) => isCompanyMatch(item, company));
};

export default function UniversityForm({ defaultValues, onSubmit, loading, onCancel }) {
  const isEditing = Boolean(defaultValues?.uuid || defaultValues?.id);
  const universityId = defaultValues?.uuid || defaultValues?.id;
  const [step, setStep] = useState(0);
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(resolveAssetUrl(defaultValues?.logo));
  const [bannerPreview, setBannerPreview] = useState(resolveAssetUrl(defaultValues?.banner));
  const [logoError, setLogoError] = useState('');
  const [bannerError, setBannerError] = useState('');

  // Approvals State
  const [approvals, setApprovals] = useState([]);
  const [selectedApprovals, setSelectedApprovals] = useState(() => {
    const initial = defaultValues?.approvals;
    if (Array.isArray(initial)) return initial;
    if (typeof initial === 'string') {
      try {
        const parsed = JSON.parse(initial);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return initial.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    return [];
  });
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [approvalsError, setApprovalsError] = useState('');

  // Companies State
  const [companies, setCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState(() => {
    const initial = defaultValues?.companies || defaultValues?.recruiting_companies || defaultValues?.partners;
    if (Array.isArray(initial)) return initial;
    if (typeof initial === 'string') {
      try {
        const parsed = JSON.parse(initial);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return initial
          .split(',')
          .map((s) => ({ company_name: s.trim() }))
          .filter((c) => c.company_name);
      }
    }
    return [];
  });
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [isCompanyMenuOpen, setIsCompanyMenuOpen] = useState(false);
  const companyMenuRef = useRef(null);
  const [contentTables, setContentTables] = useState(() => (
    defaultValues?.contentTables?.length
      ? mapApiTablesToEditor(defaultValues.contentTables)
      : emptyContentTables()
  ));
  const [contentParagraphs, setContentParagraphs] = useState(() => (
    defaultValues?.contentParagraphs?.length
      ? mapApiParagraphsToEditor(defaultValues.contentParagraphs)
      : emptyContentParagraphs()
  ));

  // Click outside to close company menu list
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (companyMenuRef.current && !companyMenuRef.current.contains(event.target)) {
        setIsCompanyMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Approvals Catalogue
  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        setApprovalsLoading(true);
        setApprovalsError('');

        const response = await fetch(
          'https://backend.admissionera.com/api/approvals/get-approvals'
        );

        if (!response.ok) {
          throw new Error('Failed to fetch approvals');
        }

        const result = await response.json();
        const data = Array.isArray(result)
          ? result
          : result.data ?? result.approvals ?? [];

        setApprovals(data);
      } catch (error) {
        setApprovalsError(
          error instanceof Error ? error.message : 'Something went wrong'
        );
      } finally {
        setApprovalsLoading(false);
      }
    };

    fetchApprovals();
  }, []);

  // Fetch Companies Catalogue from https://backend.admissionera.com/api/companies/get
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setCompaniesLoading(true);
        setCompaniesError('');

        const response = await fetch(
          'https://backend.admissionera.com/api/companies/get'
        );

        if (!response.ok) {
          throw new Error('Failed to fetch companies');
        }

        const result = await response.json();
        const data = Array.isArray(result)
          ? result
          : result.data ?? result.companies ?? [];

        setCompanies(data);
      } catch (error) {
        setCompaniesError(
          error instanceof Error ? error.message : 'Failed to fetch companies'
        );
      } finally {
        setCompaniesLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  // Pre-load existing approvals when editing a university if not already provided
  useEffect(() => {
    const universityId = defaultValues?.uuid || defaultValues?.id;
    if (!universityId) return;

    if (defaultValues?.approvals && defaultValues.approvals.length > 0) {
      setSelectedApprovals(defaultValues.approvals);
      return;
    }

    const fetchExistingApprovals = async () => {
      try {
        const response = await fetch(
          `${ASSET_BASE}/api/academic/university-approvals/${universityId}`
        );
        if (!response.ok) return;
        const result = await response.json();
        const data = Array.isArray(result) ? result : result.data || [];
        if (Array.isArray(data) && data.length > 0) {
          setSelectedApprovals(data);
        }
      } catch {
        // ignore error
      }
    };

    fetchExistingApprovals();
  }, [defaultValues?.id, defaultValues?.uuid, defaultValues?.approvals]);

  // Once catalogue approvals are fetched, align selectedApprovals to catalogue items
  useEffect(() => {
    if (!approvals.length) return;
    setSelectedApprovals((prev) => {
      if (!prev.length) return prev;
      const matched = approvals.filter((item) =>
        prev.some((p) => isApprovalMatch(p, item))
      );
      return matched.length ? matched : prev;
    });
  }, [approvals]);

  // Once catalogue companies are fetched, align selectedCompanies
  useEffect(() => {
    if (!companies.length) return;
    setSelectedCompanies((prev) => {
      if (!prev.length) return prev;
      const matched = companies.filter((item) =>
        prev.some((p) => isCompanyMatch(p, item))
      );
      const unmatched = prev.filter((p) => !companies.some((c) => isCompanyMatch(c, p)));
      return [...matched, ...unmatched];
    });
  }, [companies]);

  const handleToggleApproval = (approval) => {
    setSelectedApprovals((prev) => {
      const exists = prev.some((item) => isApprovalMatch(item, approval));
      if (exists) {
        return prev.filter((item) => !isApprovalMatch(item, approval));
      } else {
        return [...prev, approval];
      }
    });
  };

  const handleToggleCompany = (company) => {
    setSelectedCompanies((prev) => {
      const exists = prev.some((item) => isCompanyMatch(item, company));
      if (exists) {
        return prev.filter((item) => !isCompanyMatch(item, company));
      } else {
        return [...prev, company];
      }
    });
  };

  const handleRemoveCompany = (company, e) => {
    e?.stopPropagation();
    setSelectedCompanies((prev) => prev.filter((item) => !isCompanyMatch(item, company)));
  };

  const { register, handleSubmit, control, trigger, formState: { errors } } = useForm({
    defaultValues: {
      status: 'ACTIVE',
      type: '',
      description: '',
      features: '',
      admission_process: '',
      career: '',
      ratings: '',
      world_rank: '',
      grade: '',
      ...defaultValues,
      code: defaultValues?.code || defaultValues?.short_name || '',
    },
  });

  useEffect(() => {
    if (!logoFile) return undefined;
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  useEffect(() => {
    if (!bannerFile) return undefined;
    const url = URL.createObjectURL(bannerFile);
    setBannerPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [bannerFile]);

  const pickImage = (file, setFile, setError, inputEl) => {
    setError('');
    if (!file) {
      setFile(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      setFile(null);
      if (inputEl) inputEl.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be under 2MB');
      setFile(null);
      if (inputEl) inputEl.value = '';
      return;
    }
    setFile(file);
  };

  useEffect(() => {
    if (!universityId) return undefined;

    let cancelled = false;
    (async () => {
      try {
        if (!defaultValues?.contentTables?.length) {
          const res = await universityContentTableService.getByUniversity(universityId);
          if (!cancelled && res.data?.length) {
            setContentTables(mapApiTablesToEditor(res.data));
          }
        }
        if (!defaultValues?.contentParagraphs?.length) {
          const res = await universityContentTableService.getParagraphsByUniversity(universityId);
          if (!cancelled && res.data?.length) {
            setContentParagraphs(mapApiParagraphsToEditor(res.data));
          }
        }
      } catch {
        // Keep empty content if fetch fails
      }
    })();

    return () => { cancelled = true; };
  }, [universityId, defaultValues?.contentTables, defaultValues?.contentParagraphs]);

  const goNext = async () => {
    if (step === 0) {
      const valid = await trigger(UNIVERSITY_STEP1_FIELDS);
      if (!valid) {
        toast.error('Please fill required university details');
        return;
      }
    }
    setStep((s) => Math.min(s + 1, UNIVERSITY_FORM_STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const submit = handleSubmit(async (data) => {
    await onSubmit({
      ...data,
      short_name: data.code || data.short_name,
      logo: logoFile || undefined,
      approvals: selectedApprovals,
      companies: selectedCompanies,
      banner: bannerFile || undefined,
      existingLogo: defaultValues?.logo || '',
      existingBanner: defaultValues?.banner || '',
      contentTables,
      contentParagraphs,
    });
  });

  const isLastStep = step === UNIVERSITY_FORM_STEPS.length - 1;

  const filteredCompanies = companies.filter((c) => {
    const name = getCompanyKey(c).toLowerCase();
    const query = companySearch.trim().toLowerCase();
    return !query || name.includes(query);
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
      className="space-y-5"
    >
      <WizardStepIndicator steps={UNIVERSITY_FORM_STEPS} currentStep={step} />

      {step === 0 && (
      <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="University Name *" error={errors.name?.message}>
          <input className="input" placeholder="e.g. Amity University" {...register('name', { required: 'University name is required' })} />
        </FormField>
        <FormField label="Short Name / Code *" error={errors.code?.message}>
          <input className="input uppercase" placeholder="e.g. AMITY" {...register('code', { required: 'Code is required' })} />
        </FormField>
        <FormField label="University Type *" error={errors.type?.message}>
          <Controller
            name="type"
            control={control}
            rules={{ required: 'University type is required' }}
            render={({ field }) => (
              <select className="input" {...field}>
                <option value="">Select type</option>
                {UNIVERSITY_TYPES.map((type) => (
                  <option key={type} value={type}>{formatLabel(type)}</option>
                ))}
              </select>
            )}
          />
        </FormField>
        <FormField label="Location" error={errors.location?.message}>
          <input className="input" placeholder="City, State" {...register('location')} />
        </FormField>
        <FormField label="Website" error={errors.website?.message} className="sm:col-span-2">
          <input
            className="input"
            placeholder="https://"
            {...register('website', {
              validate: (v) => !v || /^https?:\/\//i.test(v) || 'Enter a valid URL starting with http:// or https://',
            })}
          />
        </FormField>
        <FormField label="Grade">
          <input className="input" placeholder="e.g. A+" {...register('grade')} />
        </FormField>
        <FormField label="Ratings">
          <input className="input" type="number" step="0.1" min="0" max="5" placeholder="e.g. 4.5" {...register('ratings')} />
        </FormField>
        <FormField label="World Rank">
          <input className="input" type="number" min="1" placeholder="e.g. 1200" {...register('world_rank')} />
        </FormField>
        <FormField label="Status">
          <select className="input" {...register('status')}>
            {ENTITY_STATUSES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Logo"
          error={logoError}
          hint="Images only, 400x400px max 2MB. Saved as WebP on the server."
        >
          <input
            type="file"
            accept="image/*"
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
            onChange={(e) => pickImage(e.target.files?.[0], setLogoFile, setLogoError, e.target)}
          />
          {logoPreview && (
            <img src={logoPreview} alt="Logo preview" className="mt-3 h-20 w-20 rounded-lg border border-slate-200 object-contain bg-white" />
          )}
        </FormField>

        <FormField
          label="Banner"
          error={bannerError}
          hint="Images only, 1920x800px max 2MB. Saved as WebP on the server."
        >
          <input
            type="file"
            accept="image/*"
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
            onChange={(e) => pickImage(e.target.files?.[0], setBannerFile, setBannerError, e.target)}
          />
          {bannerPreview && (
            <img src={bannerPreview} alt="Banner preview" className="mt-3 h-24 w-full rounded-lg border border-slate-200 object-cover bg-white" />
          )}
        </FormField>
      </div>

      {/* Approvals Section */}
      <FormField
        label={`Approvals (${selectedApprovals.length} selected)`}
        error={approvalsError}
        hint="Select the approvals applicable to this university."
      >
        {approvalsLoading ? (
          <p className="text-sm text-slate-500">
            Loading approvals...
          </p>
        ) : (
          <div className="space-y-3">
            {approvals.length > 0 && (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Select all that apply</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedApprovals([...approvals])}
                    className="font-medium text-brand-600 hover:text-brand-700"
                  >
                    Select All
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedApprovals([])}
                    className="font-medium text-slate-500 hover:text-slate-700"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {approvals.map((approval, index) => {
                const isSelected = isApprovalSelected(approval, selectedApprovals);
                const label = formatApprovalLabel(approval);
                const key = getApprovalKey(approval) || index;
                const logoSrc = resolveAssetUrl(
                  typeof approval === 'string'
                    ? `/uploads/${approval}`
                    : approval.approval_logo || approval.logo || ''
                );

                return (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 text-brand-900 shadow-sm ring-1 ring-brand-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleApproval(approval)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    {logoSrc && (
                      <img
                        src={logoSrc}
                        alt={label}
                        className="h-7 w-7 rounded border border-slate-200 bg-white object-contain p-0.5"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <span className="text-sm font-medium">
                      {label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {!approvalsLoading && !approvalsError && approvals.length === 0 && (
          <p className="text-sm text-slate-500">
            No approvals found.
          </p>
        )}
      </FormField>

      {/* Recruiting Companies / Partners Section with Searchable & Selectable Menulist */}
      <FormField
        label={`Recruiting Companies (${selectedCompanies.length} selected)`}
        error={companiesError}
        hint="Search and select companies that recruit from this university."
      >
        <div ref={companyMenuRef} className="relative space-y-2">
          {/* Trigger Box with Selected Chips & Toggle */}
          <div
            onClick={() => setIsCompanyMenuOpen((prev) => !prev)}
            className={`input min-h-[46px] cursor-pointer flex flex-wrap items-center justify-between gap-2 bg-white transition-all ${
              isCompanyMenuOpen ? 'border-brand-500 ring-2 ring-brand-100' : ''
            }`}
          >
            <div className="flex flex-wrap items-center gap-1.5 flex-1 py-1">
              {selectedCompanies.length === 0 ? (
                <span className="text-slate-400 text-sm flex items-center gap-2 select-none">
                  <Building2 className="h-4 w-4 text-slate-300" />
                  Click to search &amp; select recruiting companies...
                </span>
              ) : (
                selectedCompanies.map((comp) => {
                  const name = comp.company_name || comp.name || getCompanyKey(comp);
                  return (
                    <span
                      key={getCompanyKey(comp)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-brand-50 border border-brand-200 px-2.5 py-1 text-xs font-medium text-brand-900 shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {comp.logo ? (
                        <img
                          src={comp.logo}
                          alt=""
                          className="h-4 w-4 object-contain rounded-full bg-white p-0.5 border border-slate-200"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <Building2 className="h-3 w-3 text-brand-600" />
                      )}
                      <span>{name}</span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveCompany(comp, e)}
                        className="text-brand-400 hover:text-red-500 p-0.5 transition-colors"
                        title={`Remove ${name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {selectedCompanies.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCompanies([]);
                  }}
                  className="text-xs text-slate-400 hover:text-red-600 font-medium transition-colors px-1"
                >
                  Clear all
                </button>
              )}
              {isCompanyMenuOpen ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </div>

          {/* Searchable Dropdown Menulist */}
          {isCompanyMenuOpen && (
            <div className="absolute z-30 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5">
              {/* Search Toolbar inside Menu */}
              <div className="p-3 border-b border-slate-100 bg-slate-50/80 rounded-t-xl space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    placeholder="Search companies by name (e.g. TCS, Infosys, Wipro, Google)..."
                    className="input pl-9 pr-8 text-xs !py-2 bg-white"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  {companySearch && (
                    <button
                      type="button"
                      onClick={() => setCompanySearch('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>
                    Showing {filteredCompanies.length} of {companies.length} companies
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCompanies((prev) => {
                          const toAdd = filteredCompanies.filter(
                            (item) => !prev.some((p) => isCompanyMatch(p, item))
                          );
                          return [...prev, ...toAdd];
                        });
                      }}
                      className="font-medium text-brand-600 hover:text-brand-700"
                    >
                      Select Filtered
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCompanies([])}
                      className="font-medium text-slate-500 hover:text-slate-700"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Company List */}
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 p-1">
                {companiesLoading ? (
                  <div className="p-5 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                    Loading companies catalogue...
                  </div>
                ) : filteredCompanies.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-500">
                    No companies found matching &quot;{companySearch}&quot;
                  </div>
                ) : (
                  filteredCompanies.map((company) => {
                    const isSelected = isCompanySelected(company, selectedCompanies);
                    const name = company.company_name || company.name || getCompanyKey(company);

                    return (
                      <div
                        key={getCompanyKey(company)}
                        onClick={() => handleToggleCompany(company)}
                        className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-brand-50 text-brand-900 font-medium'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                          />
                          {company.logo ? (
                            <img
                              src={company.logo}
                              alt=""
                              className="h-6 w-6 rounded border border-slate-200 bg-white object-contain p-0.5 shrink-0"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="h-6 w-6 rounded border border-slate-200 bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-bold shrink-0">
                              {name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs truncate">{name}</span>
                        </div>

                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-slate-400 hover:text-brand-600 p-1 transition-colors"
                            title={company.website}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </FormField>

      <FormField label="Description" hint="Supports headings, links, colors, highlights, and text formatting">
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              value={field.value}
              onChange={field.onChange}
              placeholder="Write a detailed overview of the university..."
            />
          )}
        />
      </FormField>

      <FormField label="Features" hint="Key highlights and campus features">
        <Controller
          name="features"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              value={field.value}
              onChange={field.onChange}
              placeholder="List university features..."
            />
          )}
        />
      </FormField>

      <FormField label="Admission Process" hint="Steps, eligibility, and application notes">
        <Controller
          name="admission_process"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              value={field.value}
              onChange={field.onChange}
              placeholder="Describe the admission process..."
            />
          )}
        />
      </FormField>

      <FormField label="Career" hint="Placements, career outcomes, and opportunities">
        <Controller
          name="career"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              value={field.value}
              onChange={field.onChange}
              placeholder="Describe career opportunities..."
            />
          )}
        />
      </FormField>
      </>
      )}

      {step === 1 && (
        <Step2ContentTables
          contentTables={contentTables}
          onContentTablesChange={setContentTables}
        />
      )}

      {step === 2 && (
        <Step3ContentParagraphs
          contentParagraphs={contentParagraphs}
          onContentParagraphsChange={setContentParagraphs}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div>
          {onCancel && step === 0 && (
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
          {step > 0 && (
            <button type="button" className="btn-secondary" onClick={goBack}>
              Back
            </button>
          )}
        </div>
        <div className="flex gap-3">
          {!isLastStep ? (
            <button type="button" className="btn-primary" onClick={goNext}>
              Next
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              disabled={loading}
              onClick={submit}
            >
              {loading ? 'Saving...' : isEditing ? 'Update University' : 'Save University'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
