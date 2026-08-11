import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      <p className="mt-3 text-sm">{message}</p>
    </div>
  );
}

export function SkeletonCard() {
  return <div className="card animate-pulse h-24 bg-slate-100" />;
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}
