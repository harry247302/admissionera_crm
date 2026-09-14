import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import FormField from './FormField';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export default function UniversityApprovalForm({ university, onSubmit, loading, onCancel }) {
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoError, setLogoError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      approval_name: '',
      approval_description: '',
      display_order: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    setLogoError('');

    if (!file) {
      setLogoFile(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setLogoError('Only image files are allowed');
      setLogoFile(null);
      e.target.value = '';
      return;
    }

    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('Image must be under 2MB');
      setLogoFile(null);
      e.target.value = '';
      return;
    }

    setLogoFile(file);
  };

  const submit = handleSubmit(async (data) => {
    if (!logoFile) {
      setLogoError('Approval logo is required');
      return;
    }

    await onSubmit({
      university_id: university?.uuid || university?.id,
      approval_name: data.approval_name,
      approval_description: data.approval_description || '',
      display_order: Number(data.display_order) || 0,
      is_active: Boolean(data.is_active),
      approval_logo: logoFile,
    });
  });

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Adding approval for <span className="font-medium text-slate-900">{university?.name}</span>
      </div>

      <FormField label="Approval Name *" error={errors.approval_name?.message}>
        <input
          className="input"
          placeholder="e.g. ECFMG, UGC, AICTE"
          {...register('approval_name', { required: 'Approval name is required' })}
        />
      </FormField>

      <FormField
        label="Approval Logo *"
        error={logoError}
        hint="Images only, max 2MB. Saved as WebP on the server."
      >
        <input
          type="file"
          accept="image/*"
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
          onChange={handleLogoChange}
        />
        {logoPreview && (
          <div className="mt-3 flex items-center gap-3">
            <img
              src={logoPreview}
              alt="Logo preview"
              className="h-14 w-14 rounded-lg border border-slate-200 object-contain bg-white p-1"
            />
            <p className="text-xs text-slate-500 truncate">{logoFile?.name}</p>
          </div>
        )}
      </FormField>

      <FormField label="Description">
        <textarea
          className="input min-h-[90px]"
          placeholder="Short description of this approval / accreditation"
          {...register('approval_description')}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Display Order">
          <input
            type="number"
            min={0}
            className="input"
            {...register('display_order')}
          />
        </FormField>
        <FormField label="Status">
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="rounded border-slate-300" {...register('is_active')} />
            Active
          </label>
        </FormField>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving…' : 'Add Approval'}
        </button>
      </div>
    </form>
  );
}
