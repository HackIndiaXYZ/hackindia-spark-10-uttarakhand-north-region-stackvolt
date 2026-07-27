import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, PageHeader, EmptyState } from '../../components/patterns';
import { Field, Button } from '../../components/ui';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => (await api.get('/crm/customers', { params: { search: search || undefined } })).data,
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; company?: string; email?: string; phone?: string }) =>
      api.post('/crm/customers', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowCreate(false);
    },
  });

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Every account your business works with, in one place."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New customer
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <Search size={16} className="text-text-faint" />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm text-text placeholder:text-text-faint outline-none"
          placeholder="Search customers by name, company, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading && <p className="text-sm text-text-faint">Loading customers…</p>}

      {!isLoading && data?.items?.length === 0 && (
        <EmptyState title="No customers yet" description="Add your first customer, or ask the AI Assistant to create one for you." />
      )}

      {data?.items?.length > 0 && (
       <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-text-faint">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Phone</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c: any) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                  <td className="px-5 py-3">
                    <Link to={`/app/customers/${c.id}`} className="font-medium text-text hover:text-volt-soft">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-text-muted">{c.company ?? '—'}</td>
                  <td className="px-5 py-3 text-text-muted">{c.email ?? '—'}</td>
                  <td className="px-5 py-3 text-text-muted font-mono">{c.phone ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      )}

      {showCreate && (
        <CreateCustomerModal
          onClose={() => setShowCreate(false)}
          onSubmit={(payload) => createMutation.mutate(payload)}
          loading={createMutation.isPending}
        />
      )}
    </div>
  );
}

function CreateCustomerModal({
  onClose,
  onSubmit,
  loading,
}: {
  onClose: () => void;
  onSubmit: (payload: { name: string; company?: string; email?: string; phone?: string }) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text">New customer</h2>
          <button onClick={onClose} className="text-text-faint hover:text-text">
            <X size={18} />
          </button>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
        >
          <Field label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Field label="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <Field label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Field label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create customer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
