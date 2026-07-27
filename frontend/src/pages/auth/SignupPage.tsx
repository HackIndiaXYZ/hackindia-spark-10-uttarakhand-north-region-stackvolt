import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Field, Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', organizationName: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup(form);
      navigate('/app');
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      setError(Array.isArray(message) ? message.join(', ') : message ?? 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create your workspace" subtitle="Start running your business on AITELLION">
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Field label="Full name" required value={form.fullName} onChange={update('fullName')} placeholder="Jordan Lee" />
        <Field label="Company / organization name" required value={form.organizationName} onChange={update('organizationName')} placeholder="Acme Retail Co." />
        <Field label="Work email" type="email" required value={form.email} onChange={update('email')} placeholder="you@company.com" />
        <Field label="Password" type="password" required value={form.password} onChange={update('password')} placeholder="At least 8 characters" />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating workspace…' : 'Create workspace'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-text-muted">
        Already on AITELLION?{' '}
        <Link to="/login" className="text-volt-soft hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
