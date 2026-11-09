import { useState, useEffect } from 'react';
import {
  Building2,
  Globe,
  Image as ImageIcon,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Check,
} from 'lucide-react';
import Modal from '../common/Modal';

export default function CompanyFormModal({
  open,
  onClose,
  onSubmit,
  saving = false,
  initialData = null,
}) {
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [logo, setLogo] = useState('');
  const [logoError, setLogoError] = useState(false);
  const [formError, setFormError] = useState('');

  // Reset or populate fields when opened
  useEffect(() => {
    if (open) {
      setCompanyName(initialData?.company_name || initialData?.name || '');
      setWebsite(initialData?.website || '');
      setLogo(initialData?.logo || '');
      setLogoError(false);
      setFormError('');
    }
  }, [open, initialData]);

  // Extract clean domain from website to suggest logo
  const extractDomain = (url) => {
    if (!url) return '';
    try {
      let clean = url.trim();
      if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = `https://${clean}`;
      }
      const parsed = new URL(clean);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return url
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .split('/')[0]
        .trim();
    }
  };

  const handleSuggestLogo = () => {
    const domain = extractDomain(website) || extractDomain(companyName);
    if (!domain) {
      setFormError('Please enter a company website or name to auto-suggest a logo.');
      return;
    }
    const suggestedLogo = `https://img.logo.dev/${domain.toLowerCase()}?token=YOUR_LOGO_DEV_TOKEN`;
    setLogo(suggestedLogo);
    setLogoError(false);
    setFormError('');
  };

  const handleWebsiteBlur = () => {
    if (website && !/^https?:\/\//i.test(website.trim())) {
      setWebsite(`https://${website.trim()}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = companyName.trim();
    if (!trimmedName) {
      setFormError('Company name is required.');
      return;
    }

    let cleanWebsite = website.trim();
    if (cleanWebsite && !/^https?:\/\//i.test(cleanWebsite)) {
      cleanWebsite = `https://${cleanWebsite}`;
    }

    setFormError('');
    onSubmit({
      company_name: trimmedName,
      website: cleanWebsite || null,
      logo: logo.trim() || null,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? 'Edit Company' : 'Add New Company'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Company Name */}
        <div>
          <label className="label">
            Company Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              required
              placeholder="e.g. Tata Consultancy Services, Google, Infosys"
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                if (formError) setFormError('');
              }}
              className="input pl-9"
            />
          </div>
        </div>

        {/* Website */}
        <div>
          <div className="flex items-center justify-between">
            <label className="label">Website / Careers URL</label>
            {website && (
              <a
                href={website.startsWith('http') ? website : `https://${website}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
              >
                Visit <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="relative">
            <Globe className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="https://www.example.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              onBlur={handleWebsiteBlur}
              className="input pl-9"
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Official company domain or careers portal (e.g. https://www.google.com).
          </p>
        </div>

        {/* Logo URL */}
        <div>
          <div className="flex items-center justify-between">
            <label className="label">Logo Image URL</label>
            <button
              type="button"
              onClick={handleSuggestLogo}
              disabled={!website && !companyName}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-40"
            >
              <Sparkles className="h-3 w-3" /> Auto-suggest from Domain
            </button>
          </div>
          <div className="relative">
            <ImageIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="https://img.logo.dev/example.com or hosted logo URL"
              value={logo}
              onChange={(e) => {
                setLogo(e.target.value);
                setLogoError(false);
              }}
              className="input pl-9"
            />
          </div>
        </div>

        {/* Live Card Preview */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Live Preview
          </p>
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50 p-1.5">
              {logo && !logoError ? (
                <img
                  src={logo}
                  alt={companyName || 'Company'}
                  onError={() => setLogoError(true)}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Building2 className="h-6 w-6 text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate font-semibold text-slate-900">
                {companyName || 'Company Name'}
              </h4>
              <p className="truncate text-xs text-slate-500">
                {website || 'No website provided'}
              </p>
            </div>
            {website && (
              <span className="shrink-0 rounded-full bg-slate-100 p-1.5 text-slate-500">
                <Globe className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !companyName.trim()}
            className="btn-primary"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </span>
            ) : initialData ? (
              'Update Company'
            ) : (
              'Create Company'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

