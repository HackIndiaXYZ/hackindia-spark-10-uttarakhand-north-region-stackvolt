import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Sparkles } from "lucide-react";
import { api } from "../../lib/api";
import { Card, PageHeader, Badge } from "../../components/patterns";
import { Button } from "../../components/ui";
import { formatDistanceToNow } from "date-fns";

function formatCurrency(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    cents / 100,
  );
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => (await api.get(`/crm/customers/${id}`)).data,
    enabled: !!id,
  });

  const addNote = useMutation({
    mutationFn: (body: string) =>
      api.post("/crm/notes", { body, customerId: id }),
    onSuccess: () => {
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["customer", id] });
    },
  });

  // Ask the AI Assistant (in the background) to summarize this account.
  const summarize = useMutation({
    mutationFn: () =>
      api.post("/ai/chat", {
        message: `Summarize the account for customer ID ${id} in 3-4 sentences: key deals, status, and suggested next action.`,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["customer", id] }),
  });

  if (isLoading || !customer)
    return <p className="text-sm text-text-faint">Loading customer…</p>;

  return (
    <div>
      <Link
        to="/app/customers"
        className="mb-4 inline-flex items-center gap-2 text-sm text-text-muted hover:text-text"
      >
        <ArrowLeft size={16} /> Back to customers
      </Link>

      <PageHeader
        title={customer.name}
        description={customer.company ?? undefined}
        actions={
          <Button
            onClick={() => summarize.mutate()}
            disabled={summarize.isPending}
          >
            <Sparkles size={16} />{" "}
            {summarize.isPending ? "Summarizing…" : "AI summary"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="font-display text-base font-semibold text-text">
              Deals
            </h2>
            <div className="mt-3 space-y-2">
              {customer.deals?.length ? (
                customer.deals.map((d: any) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-text">{d.title}</p>
                      <p className="text-xs text-text-faint font-mono">
                        {formatCurrency(d.valueCents, d.currency)}
                      </p>
                    </div>
                    <Badge label={d.stage} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-text-faint">
                  No deals linked to this customer yet.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="font-display text-base font-semibold text-text">
              Notes
            </h2>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (note.trim()) addNote.mutate(note);
              }}
            >
              <input
                className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-faint outline-none focus:border-volt"
                placeholder="Add a note…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button type="submit" disabled={addNote.isPending}>
                Add
              </Button>
            </form>
            <div className="mt-4 space-y-3">
              {customer.notes?.map((n: any) => (
                <div
                  key={n.id}
                  className="border-b border-border pb-3 last:border-0"
                >
                  <p className="text-sm text-text">{n.body}</p>
                  <p className="mt-1 text-xs text-text-faint">
                    {formatDistanceToNow(new Date(n.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="font-display text-base font-semibold text-text">
              Contact
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted">Email</dt>
                <dd className="text-text">{customer.email ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Phone</dt>
                <dd className="font-mono text-text">{customer.phone ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Address</dt>
                <dd className="text-text">{customer.address ?? "—"}</dd>
              </div>
            </dl>
          </Card>

          {customer.aiSummary && (
            <Card className="border-volt/30 bg-volt/5">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-volt-soft" />
                <h2 className="font-display text-sm font-semibold text-volt-soft">
                  AI summary
                </h2>
              </div>
              <p className="mt-2 text-sm text-text">{customer.aiSummary}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
