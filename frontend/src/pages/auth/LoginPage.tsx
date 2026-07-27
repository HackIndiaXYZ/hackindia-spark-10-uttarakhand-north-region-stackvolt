import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Field, Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { isAxiosError } from 'axios';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      setError(message ?? 'Could not sign in. Check your email and password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your AITELLION workspace">
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        <Field label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex items-center justify-between text-xs">
          <Link to="/forgot-password" className="text-text-muted hover:text-volt-soft">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-text-muted">
        New to AITELLION?{' '}
        <Link to="/signup" className="text-volt-soft hover:underline">
          Create your workspace
        </Link>
      </p>
    </AuthLayout>
  );
}
