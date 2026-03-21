import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTickets, type TicketStatus } from '@/context/TicketContext';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function NewTicketDialog() {
  const [open, setOpen] = useState(false);
  const { addTicket } = useTickets();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    deviceModel: '',
    osPasscode: '',
    issueDescription: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.deviceModel) {
      toast.error('Name and device model are required.');
      return;
    }
    setLoading(true);
    try {
      const ticket = await addTicket({
        ...form,
        internalNotes: '',
        publicUpdates: [{ date: new Date().toISOString().split('T')[0], message: 'Device received and logged.' }],
        status: 'Received' as TicketStatus,
        dateReceived: new Date().toISOString().split('T')[0],
      });
      toast.success(`Ticket created — Token: ${ticket.tokenId}`);
      setForm({ customerName: '', customerPhone: '', deviceModel: '', osPasscode: '', issueDescription: '' });
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create ticket');
    }
    setLoading(false);
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 pt-2">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Customer Name *</Label>
            <Input id="name" value={form.customerName} onChange={set('customerName')} placeholder="Full name" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={form.customerPhone} onChange={set('customerPhone')} placeholder="+1 (555) 000-0000" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="device">Device Model *</Label>
            <Input id="device" value={form.deviceModel} onChange={set('deviceModel')} placeholder="e.g. iPhone 15 Pro" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="passcode">OS Passcode</Label>
            <Input id="passcode" value={form.osPasscode} onChange={set('osPasscode')} placeholder="Device passcode" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="issue">Issue Description</Label>
            <Textarea id="issue" value={form.issueDescription} onChange={set('issueDescription')} placeholder="Describe the problem" rows={3} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Ticket
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
