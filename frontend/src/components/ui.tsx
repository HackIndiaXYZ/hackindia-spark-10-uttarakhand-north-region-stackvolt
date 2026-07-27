import { forwardRef, type InputHTMLAttributes } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(({ label, error, id, ...rest }, ref) => {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-text-muted">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint outline-none transition focus:border-volt focus:ring-2 focus:ring-volt/20"
        {...rest}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
});
Field.displayName = 'Field';

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-volt text-white hover:bg-volt-soft',
    ghost: 'border border-border text-text hover:bg-surface-2',
    danger: 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
