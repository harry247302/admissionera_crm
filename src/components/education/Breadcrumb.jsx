import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="mb-2 flex flex-wrap items-center gap-1 text-sm text-slate-500" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
            {last || !item.to ? (
              <span className={last ? 'font-medium text-slate-700' : ''}>{item.label}</span>
            ) : (
              <Link to={item.to} className="hover:text-brand-600">{item.label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
