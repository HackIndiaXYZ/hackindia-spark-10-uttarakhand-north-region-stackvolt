import type { ReactNode } from 'react';
import { Logo, BrandFooter } from '../components/Logo';

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-volt) 1px, transparent 1px), linear-gradient(90deg, var(--color-volt) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--color-volt), transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>
        <div className="rounded-2xl border border-border bg-surface/80 p-8 shadow-2xl backdrop-blur">
          <h1 className="font-display text-xl font-semibold text-text">{title}</h1>
          <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <div className="mt-6 flex justify-center">
          <BrandFooter />
        </div>
      </div>
    </div>
  );
}
