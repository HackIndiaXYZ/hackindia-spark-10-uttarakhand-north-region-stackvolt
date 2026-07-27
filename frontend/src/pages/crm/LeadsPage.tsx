import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, ArrowRightCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, PageHeader, EmptyState } from '../../components/patterns';
import { Field, Button } from '../../components/ui';

const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED'];

export default function LeadsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => (await api.get('/crm/leads')).data,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/crm/leads', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setShowCreate(false);
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/crm/leads/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });

  const convert = useMutation({
    mutationFn: (id: string) => api.post(`/crm/leads/${id}/convert`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Prospects working their way toward becoming customers."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New lead
          </Button>
        }
      />

      {isLoading && <p className="text-sm text-text-faint">Loading leads…</p>}

      {!isLoading && data?.items?.length === 0 && (
        <EmptyState title="No leads yet" description="Add a lead manually, or let the AI Assistant log one from an email or call." />
      )}

      {data?.items?.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-text-faint">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((lead: any) => (
                <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                  <td className="px-5 py-3 font-medium text-text">{lead.name}</td>
                  <td className="px-5 py-3 text-text-muted">{lead.company ?? '—'}</td>
                  <td className="px-5 py-3 text-text-muted">{lead.source ?? '—'}</td>
                  <td className="px-5 py-3">
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus.mutate({ id: lead.id, status: e.target.value })}
                      className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-text outline-none"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {lead.status !== 'CONVERTED' && (
                      <button
                        onClick={() => convert.mutate(lead.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-volt-soft hover:underline"
                      >
                        <ArrowRightCircle size={14} /> Convert
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      )}

      {showCreate && (
        <CreateLeadModal onClose={() => setShowCreate(false)} onSubmit={(p) => createMutation.mutate(p)} loading={createMutation.isPending} />
      )}
    </div>
  );
}

function CreateLeadModal({ onClose, onSubmit, loading }: { onClose: () => void; onSubmit: (p: any) => void; loading: boolean }) {
  const [form, setForm] = useState({ name: '', company: '', email: '', source: '' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text">New lead</h2>
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
          <Field label="Source" placeholder="Website, referral, event…" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create lead'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
