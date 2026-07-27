import { useQuery } from '@tanstack/react-query';
import { Users, Target, Handshake, TrendingUp } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, PageHeader } from '../../components/patterns';
import { formatDistanceToNow } from 'date-fns';

function formatCurrency(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

export default function DashboardPage() {
  const { data: board } = useQuery({
    queryKey: ['deals-board'],
    queryFn: async () => (await api.get('/crm/deals/board')).data,
  });
  const { data: customers } = useQuery({
    queryKey: ['customers', 'count'],
    queryFn: async () => (await api.get('/crm/customers', { params: { take: 1 } })).data,
  });
  const { data: leads } = useQuery({
    queryKey: ['leads', 'count'],
    queryFn: async () => (await api.get('/crm/leads', { params: { take: 1 } })).data,
  });
  const { data: activity } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: async () => (await api.get('/crm/activities/feed', { params: { take: 8 } })).data,
  });

  const openDealsValue =
    board &&
    Object.values(board.stages as Record<string, any[]>)
      .flat()
      .filter((d) => d.stage !== 'WON' && d.stage !== 'LOST')
      .reduce((sum, d) => sum + d.valueCents, 0);

  const wonCount = board ? board.stages.WON.length : 0;

  const kpis = [
    { label: 'Customers', value: customers?.total ?? '—', icon: Users },
    { label: 'Open leads', value: leads?.total ?? '—', icon: Target },
    { label: 'Open pipeline value', value: openDealsValue !== undefined ? formatCurrency(openDealsValue) : '—', icon: Handshake },
    { label: 'Deals won', value: wonCount, icon: TrendingUp },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="A snapshot of how your business is running today." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-muted">{label}</p>
              <Icon size={16} className="text-volt-soft" />
            </div>
            <p className="mt-3 font-display text-2xl font-semibold text-text">{value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="font-display text-base font-semibold text-text">Pipeline snapshot</h2>
          <div className="mt-4 space-y-3">
            {board &&
              Object.entries(board.stages as Record<string, any[]>).map(([stage, deals]) => (
                <div key={stage} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                  <span className="text-sm text-text-muted">{stage.replace('_', ' ')}</span>
                  <span className="text-sm font-medium text-text">{deals.length} deals</span>
                </div>
              ))}
            {!board && <p className="text-sm text-text-faint">Loading pipeline…</p>}
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-base font-semibold text-text">Recent activity</h2>
          <div className="mt-4 space-y-4">
            {activity?.length ? (
              activity.map((a: any) => (
                <div key={a.id} className="text-sm">
                  <p className="text-text">{a.summary}</p>
                  <p className="mt-0.5 text-xs text-text-faint">
                    {a.actor?.fullName ?? 'AITELLION AI'} · {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-faint">No activity yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
