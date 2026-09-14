import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import FormField from './FormField';
import { courseFaqService } from '../../services/educationService';

export default function CourseFaqForm({ course, onSubmit, loading, onCancel }) {
  const [faqs, setFaqs] = useState([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      question: '',
      answer: '',
      display: 0,
      is_active: true,
    },
  });

  const courseId = course?.uuid || course?.id;

  const loadFaqs = async () => {
    if (!courseId) return;
    setLoadingFaqs(true);
    try {
      const res = await courseFaqService.getByCourse(courseId);
      setFaqs(res.data || []);
    } catch {
      setFaqs([]);
    } finally {
      setLoadingFaqs(false);
    }
  };

  useEffect(() => {
    loadFaqs();
  }, [courseId]);

  const submit = handleSubmit(async (data) => {
    await onSubmit({
      course_uuid: courseId,
      university_id: course?.universityUuid || course?.universityId || course?.university_id,
      question: data.question.trim(),
      answer: data.answer.trim(),
      display: Number(data.display) || 0,
      is_active: Boolean(data.is_active),
    });
    reset({
      question: '',
      answer: '',
      display: 0,
      is_active: true,
    });
    await loadFaqs();
  });

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        FAQs for <span className="font-medium text-slate-900">{course?.name}</span>
        {course?.code ? <span className="text-slate-400"> ({course.code})</span> : null}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-900">Existing FAQs</p>
        {loadingFaqs ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : !faqs.length ? (
          <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            No FAQs yet for this course.
          </p>
        ) : (
          <div className="max-h-56 space-y-3 overflow-y-auto">
            {faqs.map((faq) => (
              <div key={faq.id} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-900">{faq.question}</p>
                <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{faq.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={submit} className="space-y-5 border-t border-slate-100 pt-5">
        <p className="text-sm font-medium text-slate-900">Add FAQ</p>

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

        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
            Close
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving…' : 'Add FAQ'}
          </button>
        </div>
      </form>
    </div>
  );
}
