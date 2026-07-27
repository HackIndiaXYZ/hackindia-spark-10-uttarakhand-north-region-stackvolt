import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Field, Button } from '../../components/ui';
import { api } from '../../lib/api';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      navigate('/login');
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      setError(message ?? 'That reset link is invalid or expired.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthLayout title="Reset your password" subtitle="Missing reset token">
        <p className="text-sm text-danger">This link is missing its reset token. Request a new one below.</p>
        <Link to="/forgot-password" className="mt-4 inline-block text-sm text-volt-soft hover:underline">
          Request a new link
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Make it at least 8 characters">
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Field label="New password" type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
