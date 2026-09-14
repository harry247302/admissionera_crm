import { useForm } from 'react-hook-form';
import FormField from './FormField';

export default function UniversityFaqForm({ university, onSubmit, loading, onCancel }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      question: '',
      answer: '',
      display: 0,
      is_active: true,
    },
  });

  const submit = handleSubmit(async (data) => {
    await onSubmit({
      university_id: university?.uuid || university?.id,
      question: data.question.trim(),
      answer: data.answer.trim(),
      display: Number(data.display) || 0,
      is_active: Boolean(data.is_active),
    });
  });

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Adding FAQ for <span className="font-medium text-slate-900">{university?.name}</span>
      </div>

      <FormField label="Question *" error={errors.question?.message}>
        <input
          className="input"
          placeholder="e.g. What is the admission eligibility?"
          {...register('question', { required: 'Question is required' })}
        />
      </FormField>

      <FormField label="Answer *" error={errors.answer?.message}>
        <textarea
          className="input min-h-[120px]"
          placeholder="Write the answer..."
          {...register('answer', { required: 'Answer is required' })}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Display Order">
          <input
            type="number"
            min={0}
            className="input"
            {...register('display')}
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
          {loading ? 'Saving…' : 'Add FAQ'}
        </button>
      </div>
    </form>
  );
}
