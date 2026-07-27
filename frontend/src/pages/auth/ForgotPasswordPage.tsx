import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Field, Button } from '../../components/ui';
import { api } from '../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a reset link">
      {sent ? (
        <p className="text-sm text-text-muted">
          If an account exists for <span className="text-text">{email}</span>, a reset link is on its way.
        </p>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-text-muted">
        <Link to="/login" className="text-volt-soft hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
