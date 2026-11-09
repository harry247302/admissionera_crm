import { useState, useEffect } from 'react';
import {
  Building2,
  Globe,
  ExternalLink,
  CheckCircle2,
  Edit2,
  Trash2,
} from 'lucide-react';
import Modal from '../common/Modal';
import companyService from '../../services/companyService';

export default function CompanyDetailsModal({
  open,
  onClose,
  company,
  onEdit,
  onDelete,
}) {
  const [details, setDetails] = useState(company);
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setDetails(company);
    setLogoError(false);

    const companyId = company?.id || company?.uuid;
    if (open && companyId) {
      setLoading(true);
      companyService
        .getById(companyId)
        .then((res) => {
          if (res?.data || res?.company) {
            setDetails(res.data || res.company);
          }
        })
        .catch(() => {
          // Keep initial company object if getById endpoint is unavailable or returns 404
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, company]);

  if (!details) return null;

  const { company_name, website, logo } = details;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Company Profile"
      size="md"
    >
      <div className="space-y-6">
        {/* Header Profile Section */}
        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xs">
            {logo && !logoError ? (
              <img
                src={logo}
                alt={company_name}
                onError={() => setLogoError(true)}
                className="h-full w-full object-contain"
              />
            ) : (
              <Building2 className="h-10 w-10 text-slate-400" />
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-xl font-bold text-slate-900">
                {company_name || 'Unnamed Company'}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> Active Partner
              </span>
            </div>
            {website && (
              <a
                href={website.startsWith('http') ? website : `https://${website}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
              >
                <Globe className="h-3.5 w-3.5 text-slate-400" />
                {website.replace(/^https?:\/\//i, '').replace(/\/$/, '')}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Overview Information */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Company Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Company Name</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">
                {company_name || '—'}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Official Website</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
                {website ? (
                  <a
                    href={website.startsWith('http') ? website : `https://${website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-600 hover:underline"
                  >
                    {website}
                  </a>
                ) : (
                  'Not specified'
                )}
              </p>
            </div>
            <div className="col-span-1 sm:col-span-2 rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Logo Source URL</p>
              <p className="mt-0.5 break-all font-mono text-xs text-slate-700">
                {logo || 'No logo URL configured'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(details);
                }}
                className="btn-secondary text-red-600 hover:bg-red-50 hover:text-red-700"
                title="Delete Company"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(details);
                }}
                className="btn-secondary"
                title="Edit Company"
              >
                <Edit2 className="h-4 w-4" /> Edit
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {website && (
              <a
                href={website.startsWith('http') ? website : `https://${website}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
              >
                <ExternalLink className="h-4 w-4" /> Open Website
              </a>
            )}
            <button type="button" onClick={onClose} className="btn-primary">
              Done
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
