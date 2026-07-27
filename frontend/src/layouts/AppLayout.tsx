import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Target,
  Handshake,
  Sparkles,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/customers', label: 'Customers', icon: Users },
  { to: '/app/leads', label: 'Leads', icon: Target },
  { to: '/app/deals', label: 'Deals', icon: Handshake },
  { to: '/app/assistant', label: 'AI Assistant', icon: Sparkles },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-2">
        <Logo size="sm" />
        <button
          onClick={() => setMobileNavOpen(false)}
          className="text-text-faint hover:text-text md:hidden"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileNavOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-volt/15 text-volt-soft relative before:absolute before:-left-4 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-spark'
                  : 'text-text-muted hover:bg-surface-2 hover:text-text'
              }`
            }
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-border pt-4">
        <NavLink
          to="/app/settings"
          onClick={() => setMobileNavOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive ? 'bg-volt/15 text-volt-soft' : 'text-text-muted hover:bg-surface-2 hover:text-text'
            }`
          }
        >
          <Settings size={18} />
          Settings
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-text-muted transition hover:bg-surface-2 hover:text-danger"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-ink">
      {/* Desktop sidebar — always visible from md breakpoint up */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface/50 px-4 py-6 md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar — slide-in drawer + backdrop, only rendered when open */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative flex w-72 max-w-[80vw] flex-col bg-surface px-4 py-6 shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6 md:px-8">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="text-text-muted hover:text-text md:hidden"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-text">{user?.fullName}</p>
              <p className="text-xs text-text-faint font-mono">{user?.role}</p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-3 font-display text-sm font-semibold text-volt-soft">
              {user?.fullName?.[0]?.toUpperCase() ?? '?'}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
