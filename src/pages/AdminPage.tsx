import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTickets, type Ticket } from '@/context/TicketContext';
import { NewTicketDialog } from '@/components/NewTicketDialog';
import { InviteAdminDialog } from '@/components/InviteAdminDialog';
import { TicketDetail } from '@/components/TicketDetail';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wrench, Search, LogOut, Cpu, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Session } from '@supabase/supabase-js';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-reveal-up">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground tech-glow">
            <Cpu className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold">RepairLab Admin</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { tickets, loading, refreshTickets } = useTickets();
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return <LoginScreen />;

  const filtered = tickets.filter(t =>
    [t.customerName, t.deviceModel, t.tokenId, t.status]
      .some(f => f.toLowerCase().includes(search.toLowerCase()))
  );

  const visibleIds = filtered.map(t => t.id);
  const selectedVisibleCount = visibleIds.filter(id => selectedIds.includes(id)).length;
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;

  const toggleSelectAllVisible = (checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
      return;
    }

    setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
  };

  const toggleSelectTicket = (id: string, checked: boolean) => {
    setSelectedIds(prev => (checked ? [...prev, id] : prev.filter(v => v !== id)));
  };

  const deleteTicketsByIds = async (ids: string[]) => {
    if (ids.length === 0) return;

    setDeleting(true);
    const { error } = await supabase.from('tickets').delete().in('id', ids);
    setDeleting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    if (selectedTicket && ids.includes(selectedTicket.id)) {
      setSelectedTicket(null);
    }

    await refreshTickets();
    toast.success(ids.length === 1 ? 'Ticket removed.' : `${ids.length} tickets removed.`);
  };

  const handleRemoveTicket = async (ticket: Ticket) => {
    const confirmed = window.confirm(`Remove ticket #${ticket.tokenId}?`);
    if (!confirmed) return;
    await deleteTicketsByIds([ticket.id]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(`Remove ${selectedIds.length} selected ticket(s)?`);
    if (!confirmed) return;

    await deleteTicketsByIds(selectedIds);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <span className="font-semibold">RepairLab</span>
          </div>
          <div className="flex items-center gap-2">
            <NewTicketDialog />
            <InviteAdminDialog />
            <Button size="icon" variant="ghost" onClick={handleLogout} className="h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 space-y-4">
        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center animate-reveal-up">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tickets…"
              className="pl-9"
            />
          </div>
          <Button
            variant="destructive"
            onClick={handleBulkDelete}
            disabled={selectedIds.length === 0 || deleting || loading}
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Bulk Delete {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border surface-elevated overflow-hidden animate-reveal-up-delay-1">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all visible tickets"
                      checked={allVisibleSelected}
                      onChange={e => toggleSelectAllVisible(e.target.checked)}
                      disabled={loading || deleting || visibleIds.length === 0}
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Token</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Device</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Received</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filtered.map(ticket => (
                  <tr
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/40 active:scale-[0.995]"
                  >
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select ticket ${ticket.tokenId}`}
                        checked={selectedIds.includes(ticket.id)}
                        onChange={e => toggleSelectTicket(ticket.id, e.target.checked)}
                        disabled={deleting}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{ticket.tokenId}</td>
                    <td className="px-4 py-3 font-medium">{ticket.customerName}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{ticket.deviceModel}</td>
                    <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground font-mono text-xs">{ticket.dateReceived}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => void handleRemoveTicket(ticket)}
                        disabled={deleting}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      No tickets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-reveal-up-delay-2">
          {[
            { label: 'Total', value: tickets.length },
            { label: 'In Progress', value: tickets.filter(t => ['Diagnosing', 'In Repair'].includes(t.status)).length },
            { label: 'Waiting', value: tickets.filter(t => t.status === 'Waiting for Parts').length },
            { label: 'Ready', value: tickets.filter(t => t.status === 'Ready for Pickup').length },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border p-4 surface-elevated">
              <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </main>

      <TicketDetail
        ticket={selectedTicket ? tickets.find(t => t.id === selectedTicket.id) || null : null}
        open={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
}
