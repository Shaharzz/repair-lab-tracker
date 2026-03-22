import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { Cpu, Loader2, LogOut, PackageSearch, ReceiptText, Ticket, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTickets } from '@/context/TicketContext';
import { StaggeredMenu } from '@/components/StaggeredMenu';
import { InviteAdminDialog } from '@/components/InviteAdminDialog';
import { NewTicketDialog } from '@/components/NewTicketDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-reveal-up">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="tech-glow flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Cpu className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold">RepairLab Admin</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
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
  const { tickets } = useTickets();

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return <LoginScreen />;

  const menuItems = [
    { label: 'Welcome', ariaLabel: 'Go to welcome page', link: '/admin' },
    { label: 'Tickets', ariaLabel: 'Go to tickets page', link: '/admin/tickets' },
    { label: 'Inventory', ariaLabel: 'Go to inventory page', link: '/admin/inventory' },
    { label: 'Invoice', ariaLabel: 'Go to invoice page', link: '/admin/invoice' }
  ];

  const stats = [
    { label: 'Total Tickets', value: tickets.length },
    { label: 'In Progress', value: tickets.filter(t => ['Diagnosing', 'In Repair'].includes(t.status)).length },
    { label: 'Ready', value: tickets.filter(t => t.status === 'Ready for Pickup').length },
    { label: 'Delivered', value: tickets.filter(t => t.status === 'Delivered').length }
  ];

  return (
    <div className="min-h-screen bg-background">
      <StaggeredMenu
        isFixed
        position="left"
        items={menuItems}
        displaySocials={false}
        displayLogo={false}
        menuButtonColor="#0f172a"
        changeMenuColorOnOpen={false}
      />

      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <span className="font-semibold">RepairLab Welcome</span>
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

      <main className="mx-auto max-w-6xl space-y-4 p-4">
        <div className="surface-elevated rounded-xl border p-5">
          <h1 className="text-xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Jump quickly between Tickets, Inventory, and Invoice from here or from the left menu.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link to="/admin/tickets" className="surface-elevated rounded-xl border p-4 transition hover:bg-muted/40">
            <div className="mb-2 flex items-center gap-2">
              <Ticket className="h-4 w-4 text-primary" />
              <p className="font-medium">Tickets</p>
            </div>
            <p className="text-sm text-muted-foreground">Manage tickets, updates, and customer status.</p>
          </Link>
          <Link to="/admin/inventory" className="surface-elevated rounded-xl border p-4 transition hover:bg-muted/40">
            <div className="mb-2 flex items-center gap-2">
              <PackageSearch className="h-4 w-4 text-primary" />
              <p className="font-medium">Inventory</p>
            </div>
            <p className="text-sm text-muted-foreground">Track common devices and stock direction.</p>
          </Link>
          <Link to="/admin/invoice" className="surface-elevated rounded-xl border p-4 transition hover:bg-muted/40">
            <div className="mb-2 flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-primary" />
              <p className="font-medium">Invoice</p>
            </div>
            <p className="text-sm text-muted-foreground">Create invoices for ready and delivered devices.</p>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(stat => (
            <div key={stat.label} className="surface-elevated rounded-xl border p-4">
              <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
