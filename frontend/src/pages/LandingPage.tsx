import { Link } from 'react-router-dom';
import { ArrowRight, Users, Handshake, Sparkles, ShieldCheck } from 'lucide-react';
import { Logo, BrandFooter } from '../components/Logo';
import { Button } from '../components/ui';

const MODULES = [
  { icon: Users, name: 'CRM', copy: 'Customers, leads, and deals in one pipeline your whole team can see.' },
  { icon: Handshake, name: 'Deals & Tasks', copy: 'Move opportunities through your pipeline and never drop a follow-up.' },
  { icon: Sparkles, name: 'AI Assistant', copy: 'Ask it to look things up or take real action on your data — it actually executes.' },
  { icon: ShieldCheck, name: 'Roles & Permissions', copy: 'Eight built-in roles so every teammate sees exactly what they should.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ink text-text">
      <header className="flex items-center justify-between px-8 py-6">
        <Logo showPulse={false} />
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-text-muted hover:text-text">
            Sign in
          </Link>
          <Link to="/signup">
            <Button>Start free</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-8 pb-24 pt-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-text-muted">
          <span className="text-spark">⚡</span> Built by Team StackVolt
        </span>
        <h1 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
          The AI operating system<br /> for growing businesses
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base text-text-muted">
          CRM, operations, and an AI assistant that actually takes action — not just answers questions.
          Run your business from one workspace.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/signup">
            <Button>
              Create your workspace <ArrowRight size={16} />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
        </div>
        <div className="voltage-line mx-auto mt-16 w-full max-w-md rounded-full" />
      </section>

      <section className="mx-auto max-w-5xl px-8 pb-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map(({ icon: Icon, name, copy }) => (
            <div key={name} className="rounded-xl border border-border bg-surface p-5">
              <Icon size={20} className="text-volt-soft" />
              <h3 className="mt-3 font-display text-sm font-semibold text-text">{name}</h3>
              <p className="mt-1.5 text-sm text-text-muted">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-8 py-8 text-center">
        <BrandFooter />
      </footer>
    </div>
  );
}
