import { useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Cpu, FileText, Loader2, LogOut, Wrench } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTickets } from '@/context/TicketContext';
import type { Json, Tables } from '@/integrations/supabase/types';
import { StaggeredMenu } from '@/components/StaggeredMenu';
import { InviteAdminDialog } from '@/components/InviteAdminDialog';
import { NewTicketDialog } from '@/components/NewTicketDialog';
import { InvoicePrintDocument, type InvoicePrintData } from '@/components/InvoicePrintDocument';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { InvoiceLineItem } from '@/lib/invoicePdf';

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

export default function InvoicePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { tickets, loading } = useTickets();
  const [invoices, setInvoices] = useState<Tables<'invoices'>[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [generatingTicketId, setGeneratingTicketId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('מזומן');
  const [printData, setPrintData] = useState<InvoicePrintData | null>(null);
  const [printTitle, setPrintTitle] = useState('invoice');
  const [pendingPrint, setPendingPrint] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const triggerPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printTitle,
    pageStyle: '@page { size: A4; margin: 12mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }'
  });

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

  const invoiceCandidates = useMemo(
    () => tickets.filter(t => ['Ready for Pickup', 'Delivered'].includes(t.status)),
    [tickets]
  );

  const invoiceByTicketId = useMemo(() => {
    const map = new Map<string, Tables<'invoices'>>();
    for (const invoice of invoices) {
      if (invoice.ticket_id) {
        map.set(invoice.ticket_id, invoice);
      }
    }
    return map;
  }, [invoices]);

  const fetchInvoices = async () => {
    setInvoicesLoading(true);
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('issue_date', { ascending: false });

    if (error) {
      toast.error(error.message);
      setInvoicesLoading(false);
      return;
    }

    setInvoices(data || []);
    setInvoicesLoading(false);
  };

  const toInvoiceItems = (raw: Json | null, ticketDeviceModel: string): InvoiceLineItem[] => {
    if (Array.isArray(raw)) {
      const parsed = raw
        .map(item => {
          if (typeof item !== 'object' || item === null) return null;
          const row = item as Record<string, Json>;
          const description = typeof row.description === 'string' ? row.description : null;
          const qty = typeof row.qty === 'number' ? row.qty : null;
          const unitPrice = typeof row.unit_price === 'number' ? row.unit_price : null;
          if (!description || qty === null || unitPrice === null) return null;
          return { description, qty, unit_price: unitPrice };
        })
        .filter((v): v is InvoiceLineItem => v !== null);

      if (parsed.length > 0) return parsed;
    }

    return [
      {
        description: `תיקון ${ticketDeviceModel}`,
        qty: 1,
        unit_price: 0
      }
    ];
  };

  const buildInvoiceNumber = (tokenId: string): string => {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `INV-${datePart}-${tokenId.slice(0, 4).toUpperCase()}`;
  };

  const handleGenerateInvoice = async (ticket: (typeof invoiceCandidates)[number]) => {
    setGeneratingTicketId(ticket.id);

    const existing = invoiceByTicketId.get(ticket.id);
    const lineItems: InvoiceLineItem[] = [
      {
        description: `תיקון ${ticket.deviceModel}`,
        qty: 1,
        unit_price: ticket.price ?? 0
      }
    ];

    const payload = {
      invoice_number: existing?.invoice_number || buildInvoiceNumber(ticket.tokenId),
      ticket_id: ticket.id,
      customer_name: ticket.customerName,
      total_amount: ticket.price ?? 0,
      status: 'generated',
      payment_method: paymentMethod,
      line_items: lineItems,
      issue_date: new Date().toISOString().slice(0, 10),
      paid_at: null
    };

    let error: Error | null = null;

    if (existing) {
      const { error: updateError } = await supabase
        .from('invoices')
        .update(payload)
        .eq('id', existing.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('invoices')
        .insert(payload);
      error = insertError;
    }

    setGeneratingTicketId(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    await fetchInvoices();
    toast.success(`Invoice linked for #${ticket.tokenId}.`);
  };

  const handleOpenInvoicePdf = (ticket: (typeof invoiceCandidates)[number]) => {
    const invoice = invoiceByTicketId.get(ticket.id);
    if (!invoice) {
      toast.error('Generate an invoice first.');
      return;
    }

    const lineItems = toInvoiceItems(invoice.line_items, ticket.deviceModel);
    const totalAmount = typeof invoice.total_amount === 'number'
      ? invoice.total_amount
      : lineItems.reduce((sum, item) => sum + item.qty * item.unit_price, 0);

    setPrintTitle(`invoice-${invoice.invoice_number}`);
    setPrintData({
      invoiceNumber: invoice.invoice_number,
      customerName: invoice.customer_name,
      issueDate: invoice.issue_date,
      paymentMethod: invoice.payment_method || 'לא צוין',
      status: invoice.status,
      totalAmount,
      lineItems
    });
    setPendingPrint(true);
  };

  useEffect(() => {
    if (!pendingPrint || !printData || !printRef.current) return;
    void triggerPrint();
    setPendingPrint(false);
  }, [pendingPrint, printData, triggerPrint]);

  useEffect(() => {
    if (!session) return;
    void fetchInvoices();
  }, [session]);

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
            <span className="font-semibold">RepairLab Invoice</span>
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
        <div className="surface-elevated rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Invoice Generation</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Tickets marked as Ready for Pickup or Delivered appear here for quick invoice creation.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Payment method:</span>
            <select
              className="rounded-md border bg-background px-2 py-1 text-sm"
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
            >
              <option value="מזומן">מזומן</option>
              <option value="אשראי">אשראי</option>
              <option value="ביט">ביט</option>
              <option value="העברה בנקאית">העברה בנקאית</option>
            </select>
          </div>
        </div>

        <div className="surface-elevated overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Token</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Invoice #</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Total</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : (
                invoiceCandidates.map(ticket => (
                  <tr key={ticket.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{ticket.tokenId}</td>
                    <td className="px-4 py-3 font-mono text-xs">{invoiceByTicketId.get(ticket.id)?.invoice_number || '-'}</td>
                    <td className="px-4 py-3">{ticket.customerName}</td>
                    <td className="px-4 py-3">{invoiceByTicketId.get(ticket.id)?.status || ticket.status}</td>
                    <td className="px-4 py-3 tabular-nums">{invoiceByTicketId.get(ticket.id)?.total_amount ?? ticket.price ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          disabled={generatingTicketId === ticket.id || invoicesLoading}
                          onClick={() => void handleGenerateInvoice(ticket)}
                        >
                          {generatingTicketId === ticket.id && <Loader2 className="h-4 w-4 animate-spin" />}
                          {invoiceByTicketId.has(ticket.id) ? 'Regenerate' : 'Generate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={!invoiceByTicketId.has(ticket.id)}
                          onClick={() => handleOpenInvoicePdf(ticket)}
                        >
                          PDF בעברית
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!loading && invoiceCandidates.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No invoice-ready tickets yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <div style={{ position: 'fixed', top: -10000, left: -10000 }} aria-hidden>
        {printData ? <InvoicePrintDocument ref={printRef} data={printData} /> : null}
      </div>
    </div>
  );
}






