import { useParams } from 'react-router-dom';
import { useTickets } from '@/context/TicketContext';
import { ProgressStepper } from '@/components/ProgressStepper';
import { Cpu, SearchX, CalendarDays, Smartphone } from 'lucide-react';

export default function TrackPage() {
  const { tokenId } = useParams<{ tokenId: string }>();
  const { getTicketByToken } = useTickets();
  const ticket = tokenId ? getTicketByToken(tokenId) : undefined;

  if (!ticket) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center animate-reveal-up">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <SearchX className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold mb-1">Ticket Not Found</h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            We couldn't find a repair ticket with that tracking code. Please double-check the link you received.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4">
          <Cpu className="h-5 w-5 text-primary" />
          <span className="font-semibold">RepairLab</span>
          <span className="ml-auto font-mono text-xs text-muted-foreground">{ticket.tokenId}</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-4 space-y-6">
        {/* Hero */}
        <div className="animate-reveal-up">
          <h1 className="text-2xl font-semibold leading-tight" style={{ textWrap: 'balance' }}>
            Repair Tracking
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Follow the progress of your device repair below.</p>
        </div>

        {/* Device info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-reveal-up-delay-1">
          <div className="flex items-start gap-3 rounded-xl border p-4 surface-elevated">
            <Smartphone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Device</p>
              <p className="font-medium text-sm">{ticket.deviceModel}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border p-4 surface-elevated">
            <CalendarDays className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Received</p>
              <p className="font-medium text-sm font-mono">{ticket.dateReceived}</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="rounded-xl border p-5 surface-elevated animate-reveal-up-delay-2">
          <h2 className="text-sm font-semibold mb-4">Progress</h2>
          <ProgressStepper currentStatus={ticket.status} />
        </div>

        {/* Updates timeline */}
        {ticket.publicUpdates.length > 0 && (
          <div className="animate-reveal-up-delay-3">
            <h2 className="text-sm font-semibold mb-3">Updates</h2>
            <div className="relative border-l-2 border-border pl-4 space-y-4">
              {[...ticket.publicUpdates].reverse().map((u, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                  <p className="font-mono text-xs text-muted-foreground">{u.date}</p>
                  <p className="text-sm mt-0.5">{u.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t mt-12">
        <div className="mx-auto max-w-2xl px-4 py-6 text-center text-xs text-muted-foreground">
          RepairLab — Electronics Repair Management
        </div>
      </footer>
    </div>
  );
}
