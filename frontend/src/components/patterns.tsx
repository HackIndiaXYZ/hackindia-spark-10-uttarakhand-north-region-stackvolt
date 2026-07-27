import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-surface p-5 ${className}`}>{children}</div>;
}

const badgeColors: Record<string, string> = {
  NEW: 'bg-volt/15 text-volt-soft',
  CONTACTED: 'bg-amber-400/15 text-amber-300',
  QUALIFIED: 'bg-emerald-400/15 text-emerald-300',
  UNQUALIFIED: 'bg-surface-3 text-text-faint',
  CONVERTED: 'bg-emerald-400/15 text-emerald-300',
  PROSPECTING: 'bg-surface-3 text-text-muted',
  QUALIFICATION: 'bg-volt/15 text-volt-soft',
  PROPOSAL: 'bg-amber-400/15 text-amber-300',
  NEGOTIATION: 'bg-orange-400/15 text-orange-300',
  WON: 'bg-emerald-400/15 text-emerald-300',
  LOST: 'bg-danger/15 text-danger',
  OPEN: 'bg-volt/15 text-volt-soft',
  IN_PROGRESS: 'bg-amber-400/15 text-amber-300',
  DONE: 'bg-emerald-400/15 text-emerald-300',
  CANCELLED: 'bg-surface-3 text-text-faint',
};

export function Badge({ label }: { label: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeColors[label] ?? 'bg-surface-3 text-text-muted'}`}>
      {label.replace('_', ' ')}
    </span>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
      <p className="font-display text-base font-semibold text-text">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-text-muted">{description}</p>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text">{title}</h1>
        {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
