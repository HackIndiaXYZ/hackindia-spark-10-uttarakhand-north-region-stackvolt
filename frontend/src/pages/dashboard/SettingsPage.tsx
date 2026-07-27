import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, PageHeader, Badge } from '../../components/patterns';
import { Field, Button } from '../../components/ui';

const ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'HR', 'FINANCE', 'SALES', 'EMPLOYEE', 'VIEWER'];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [invite, setInvite] = useState({ email: '', role: 'EMPLOYEE' });

  const { data: org } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => (await api.get('/organizations/current')).data,
  });

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: async () => (await api.get('/organizations/current/members')).data,
  });

  const inviteMutation = useMutation({
    mutationFn: () => api.post('/organizations/current/invitations', invite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setInvite({ email: '', role: 'EMPLOYEE' });
    },
  });

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" description="Manage your organization and team." />

      <Card className="mb-6">
        <h2 className="font-display text-base font-semibold text-text">Organization</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-muted">Name</dt>
            <dd className="text-text">{org?.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Workspace slug</dt>
            <dd className="font-mono text-text">{org?.slug}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-text">Team members</h2>
        </div>

        <form
          className="mt-4 flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            inviteMutation.mutate();
          }}
        >
          <Field label="Invite by email" type="email" required value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} className="flex-1" />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-muted">Role</label>
            <select
              value={invite.role}
              onChange={(e) => setInvite({ ...invite, role: e.target.value })}
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={inviteMutation.isPending}>
            <UserPlus size={16} /> Invite
          </Button>
        </form>

        <div className="mt-6 space-y-2">
          {members?.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
              <div>
                <p className="text-sm text-text">{m.user.fullName}</p>
                <p className="text-xs text-text-faint">{m.user.email}</p>
              </div>
              <Badge label={m.role} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
