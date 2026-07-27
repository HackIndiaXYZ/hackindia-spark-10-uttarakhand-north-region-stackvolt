import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, PageHeader } from '../../components/patterns';
import { Field, Button } from '../../components/ui';

const STAGES = ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'] as const;

function formatCurrency(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
}

export default function DealsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: board, isLoading } = useQuery({
    queryKey: ['deals-board'],
    queryFn: async () => (await api.get('/crm/deals/board')).data,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => (await api.get('/crm/customers', { params: { take: 100 } })).data,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/crm/deals', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals-board'] });
      setShowCreate(false);
    },
  });

  const moveStage = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => api.patch(`/crm/deals/${id}`, { stage }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deals-board'] }),
  });

  return (
    <div>
      <PageHeader
        title="Deals"
        description="Track every opportunity from first contact to close."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New deal
          </Button>
        }
      />

      {isLoading && <p className="text-sm text-text-faint">Loading pipeline…</p>}

      {board && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const deals = board.stages[stage] ?? [];
            const stageIndex = STAGES.indexOf(stage);
            return (
              <div key={stage} className="w-72 shrink-0">
                <div className="mb-3 flex items-center justify-between px-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-text-faint">{stage.replace('_', ' ')}</h3>
                  <span className="text-xs text-text-faint">{deals.length}</span>
                </div>
                <div className="space-y-3">
                  {deals.map((deal: any) => (
                    <Card key={deal.id} className="p-4">
                      <p className="text-sm font-medium text-text">{deal.title}</p>
                      <p className="mt-1 text-xs text-text-muted">{deal.customer?.name ?? 'No customer linked'}</p>
                      <p className="mt-2 font-mono text-sm text-volt-soft">{formatCurrency(deal.valueCents, deal.currency)}</p>
                      {stage !== 'WON' && stage !== 'LOST' && (
                        <div className="mt-3 flex items-center justify-between">
                          <button
                            disabled={stageIndex === 0}
                            onClick={() => moveStage.mutate({ id: deal.id, stage: STAGES[stageIndex - 1] })}
                            className="text-text-faint hover:text-text disabled:opacity-30"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            onClick={() => moveStage.mutate({ id: deal.id, stage: STAGES[stageIndex + 1] })}
                            className="text-text-faint hover:text-text"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateDealModal
          customers={customers?.items ?? []}
          onClose={() => setShowCreate(false)}
          onSubmit={(p) => createMutation.mutate(p)}
          loading={createMutation.isPending}
        />
      )}
    </div>
  );
}

function CreateDealModal({
  customers,
  onClose,
  onSubmit,
  loading,
}: {
  customers: any[];
  onClose: () => void;
  onSubmit: (p: any) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({ title: '', customerId: '', valueDollars: '' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text">New deal</h2>
          <button onClick={onClose} className="text-text-faint hover:text-text">
            <X size={18} />
          </button>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              title: form.title,
              customerId: form.customerId || undefined,
              valueCents: form.valueDollars ? Math.round(Number(form.valueDollars) * 100) : undefined,
            });
          }}
        >
          <Field label="Deal title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-muted">Customer</label>
            <select
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-volt"
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            >
              <option value="">No customer linked</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Field
            label="Value (USD)"
            type="number"
            min="0"
            value={form.valueDollars}
            onChange={(e) => setForm({ ...form, valueDollars: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create deal'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
