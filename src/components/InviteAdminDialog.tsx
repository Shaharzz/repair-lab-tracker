import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function InviteAdminDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();

    const res = await supabase.functions.invoke('invite-admin', {
      body: { email, password },
    });

    if (res.error) {
      toast.error(res.error.message || 'Failed to create admin');
    } else if (res.data?.error) {
      toast.error(res.data.error);
    } else {
      toast.success(`Admin account created for ${email}`);
      setEmail('');
      setPassword('');
      setOpen(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Invite Admin</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite New Admin</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleInvite} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-password">Temporary Password</Label>
            <Input
              id="invite-password"
              type="text"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              minLength={6}
            />
            <p className="text-xs text-muted-foreground">Share this password with the new admin so they can sign in.</p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Admin Account
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
