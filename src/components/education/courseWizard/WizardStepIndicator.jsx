import { Check } from 'lucide-react';

export default function WizardStepIndicator({ steps, currentStep, onStepClick }) {
  return (
    <div className="mb-6">
      <ol className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {steps.map((step, index) => {
          const done = index < currentStep;
          const active = index === currentStep;
          const isClickable = Boolean(onStepClick);

          return (
            <li
              key={step.key}
              onClick={() => isClickable && onStepClick(index)}
              className={`flex flex-1 items-center gap-3 ${
                isClickable ? 'cursor-pointer select-none group' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    done
                      ? 'bg-emerald-600 text-white'
                      : active
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium transition-colors ${
                      active
                        ? 'text-brand-700'
                        : done
                          ? 'text-emerald-700'
                          : 'text-slate-500 group-hover:text-slate-800'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`hidden h-px flex-1 sm:block ${
                    done ? 'bg-emerald-300' : 'bg-slate-200'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
