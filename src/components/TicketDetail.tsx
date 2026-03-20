import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTickets, STATUSES, type Ticket, type TicketStatus } from '@/context/TicketContext';
import { StatusBadge } from './StatusBadge';
import { MessageCircle, Copy, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
}

export function TicketDetail({ ticket, open, onClose }: Props) {
  const { updateTicket } = useTickets();
  const [newUpdate, setNewUpdate] = useState('');

  if (!ticket) return null;

  const trackingUrl = `${window.location.origin}/track/${ticket.tokenId}`;

  const whatsappLink = `https://wa.me/${ticket.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Hi ${ticket.customerName}, track your repair status here: ${trackingUrl}`
  )}`;

  const copyToken = () => {
    navigator.clipboard.writeText(trackingUrl);
    toast.success('Tracking link copied!');
  };

  const addPublicUpdate = () => {
    if (!newUpdate.trim()) return;
    updateTicket(ticket.id, {
      publicUpdates: [
        ...ticket.publicUpdates,
        { date: new Date().toISOString().split('T')[0], message: newUpdate.trim() },
      ],
    });
    setNewUpdate('');
    toast.success('Update added');
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-3 flex-wrap">
            <span>Ticket #{ticket.id}</span>
            <StatusBadge status={ticket.status} />
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Token & sharing */}
          <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
            <code className="font-mono text-sm flex-1 truncate">{ticket.tokenId}</code>
            <Button size="icon" variant="ghost" onClick={copyToken} className="h-8 w-8 shrink-0">
              <Copy className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" asChild className="gap-1.5 shrink-0">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          </div>

          {/* Status */}
          <div className="grid gap-1.5">
            <Label>Status</Label>
            <Select
              value={ticket.status}
              onValueChange={v => updateTicket(ticket.id, { status: v as TicketStatus })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Customer</Label>
              <Input
                value={ticket.customerName}
                onChange={e => updateTicket(ticket.id, { customerName: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Phone</Label>
              <Input
                value={ticket.customerPhone}
                onChange={e => updateTicket(ticket.id, { customerPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Device</Label>
            <Input
              value={ticket.deviceModel}
              onChange={e => updateTicket(ticket.id, { deviceModel: e.target.value })}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>OS Passcode</Label>
            <Input
              value={ticket.osPasscode}
              onChange={e => updateTicket(ticket.id, { osPasscode: e.target.value })}
              className="font-mono"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Issue</Label>
            <Textarea
              value={ticket.issueDescription}
              onChange={e => updateTicket(ticket.id, { issueDescription: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Internal Notes</Label>
            <Textarea
              value={ticket.internalNotes}
              onChange={e => updateTicket(ticket.id, { internalNotes: e.target.value })}
              rows={3}
              className="border-dashed"
            />
          </div>

          {/* Public updates */}
          <div className="grid gap-2">
            <Label>Public Updates</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {ticket.publicUpdates.map((u, i) => (
                <div key={i} className="rounded-md bg-muted p-2.5 text-sm">
                  <span className="font-mono text-xs text-muted-foreground">{u.date}</span>
                  <p className="mt-0.5">{u.message}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newUpdate}
                onChange={e => setNewUpdate(e.target.value)}
                placeholder="Add a public update…"
                onKeyDown={e => e.key === 'Enter' && addPublicUpdate()}
              />
              <Button size="icon" variant="outline" onClick={addPublicUpdate} className="shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
