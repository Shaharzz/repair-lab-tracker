import { useState } from 'react';
import { useTickets, type Ticket } from '@/context/TicketContext';
import { NewTicketDialog } from '@/components/NewTicketDialog';
import { TicketDetail } from '@/components/TicketDetail';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wrench, Search, LogOut, Cpu } from 'lucide-react';

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === 'admin') {
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-reveal-up">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground tech-glow">
            <Cpu className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold">RepairLab Admin</h1>
          <p className="text-sm text-muted-foreground">Enter password to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Password"
            value={pw}
            onChange={e => { setPw(e.target.value); setError(false); }}
            className={error ? 'border-destructive' : ''}
          />
          {error && <p className="text-xs text-destructive">Incorrect password. Hint: admin</p>}
          <Button type="submit" className="w-full">Sign In</Button>
        </form>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const { tickets } = useTickets();
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  const filtered = tickets.filter(t =>
    [t.customerName, t.deviceModel, t.tokenId, t.status]
      .some(f => f.toLowerCase().includes(search.toLowerCase()))
  );

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
            <Button size="icon" variant="ghost" onClick={() => setAuthed(false)} className="h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 space-y-4">
        {/* Search */}
        <div className="relative animate-reveal-up">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tickets…"
            className="pl-9"
          />
        </div>

        {/* Table */}
        <div className="rounded-xl border surface-elevated overflow-hidden animate-reveal-up-delay-1">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Token</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Device</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Received</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ticket => (
                  <tr
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/40 active:scale-[0.995]"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{ticket.tokenId}</td>
                    <td className="px-4 py-3 font-medium">{ticket.customerName}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{ticket.deviceModel}</td>
                    <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground font-mono text-xs">{ticket.dateReceived}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
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
