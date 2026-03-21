import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTickets, STATUSES, type Ticket, type TicketStatus } from '@/context/TicketContext';
import { StatusBadge } from './StatusBadge';
import { MessageCircle, Copy, Plus, Save, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
}

function normalizeIsraeliPhoneForWhatsapp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('972')) return digits;
  if (digits.startsWith('0')) return `972${digits.slice(1)}`;
  return digits;
}

export function TicketDetail({ ticket, open, onClose }: Props) {
  const { updateTicket } = useTickets();
  const [newUpdate, setNewUpdate] = useState('');
  const [draft, setDraft] = useState<Ticket | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ticket) {
      setDraft({ ...ticket, publicUpdates: [...(ticket.publicUpdates || [])] });
      setDirty(false);
    }
  }, [ticket?.id, open]);

  if (!ticket || !draft) return null;

  const trackingUrl = `${window.location.origin}/track/${ticket.tokenId}`;

  const whatsappPhone = normalizeIsraeliPhoneForWhatsapp(ticket.customerPhone);
  const whatsappLink = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
      `היי ${ticket.customerName}, אפשר לעקוב אחרי סטטוס התיקון שלך כאן: ${trackingUrl}`
  )}`;

  const copyToken = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(trackingUrl);
        toast.success('הקישור הועתק בהצלחה!');
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = trackingUrl;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
        toast.success('הקישור הועתק בהצלחה!');
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('ההעתקה נכשלה, אפשר להעתיק ידנית');
    }
  };

  const updateDraft = (updates: Partial<Ticket>) => {
    setDraft(prev => prev ? { ...prev, ...updates } : prev);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const { id, tokenId, ...rest } = draft;
      await updateTicket(ticket.id, rest);
      setDirty(false);
      toast.success('נשמר בהצלחה');
    } catch (err: any) {
      toast.error(err.message || 'שגיאה בשמירה');
    }
    setSaving(false);
  };

  const addPublicUpdate = () => {
    if (!newUpdate.trim()) return;
    const updated = [
      ...(draft.publicUpdates || []),
      { date: new Date().toLocaleDateString('he-IL'), message: newUpdate.trim() },
    ];
    updateDraft({ publicUpdates: updated });
    setNewUpdate('');
  };

  const removePublicUpdate = (indexToRemove: number) => {
    const updated = draft.publicUpdates.filter((_, index) => index !== indexToRemove);
    updateDraft({ publicUpdates: updated });
  };

  return (
      <Sheet open={open} onOpenChange={v => !v && onClose()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto" dir="rtl">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-3 flex-wrap text-right">
              <span className="truncate">פרטי קריאה</span>
              <StatusBadge status={draft.status} />
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 text-right">
            {/* Token & sharing */}
            <div className="flex items-center justify-between gap-2 rounded-lg bg-muted p-3" dir="ltr">
              <code className="font-mono text-sm truncate">{ticket.tokenId}</code>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={copyToken} className="h-8 w-8 shrink-0">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" asChild className="gap-1.5 shrink-0 bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    וואטסאפ
                  </a>
                </Button>
              </div>
            </div>

            {/* Status & Price Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-right">סטטוס</Label>
                <Select
                    value={draft.status}
                    onValueChange={v => updateDraft({ status: v as TicketStatus })}
                    dir="rtl"
                >
                  <SelectTrigger className="text-right"><SelectValue /></SelectTrigger>
                  <SelectContent dir="rtl">
                    {STATUSES.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* שדה המחיר + כפתור הצגה ללקוח */}
              <div className="grid gap-1.5">
                <Label className="text-right">מחיר תיקון (₪)</Label>
                <Input
                    type="number"
                    value={draft.price || ''}
                    onChange={e => updateDraft({ price: Number(e.target.value) })}
                    dir="ltr"
                    placeholder="0"
                    className="text-right"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end pr-1 -mt-2">
              <Label htmlFor="showPrice" className="text-sm text-gray-600 cursor-pointer select-none">
                הצג מחיר ללקוח בדף המעקב
              </Label>
              <input
                  type="checkbox"
                  id="showPrice"
                  checked={draft.isPricePublic || false}
                  onChange={e => updateDraft({ isPricePublic: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* Customer info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-right">שם לקוח</Label>
                <Input
                    value={draft.customerName}
                    onChange={e => updateDraft({ customerName: e.target.value })}
                    className="text-right"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-right">טלפון</Label>
                <Input
                    value={draft.customerPhone}
                    onChange={e => updateDraft({ customerPhone: e.target.value })}
                    dir="ltr"
                    className="text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-right">דגם מכשיר</Label>
                <Input
                    value={draft.deviceModel}
                    onChange={e => updateDraft({ deviceModel: e.target.value })}
                    className="text-right"
                    dir="ltr"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-right">קוד נעילה</Label>
                <Input
                    value={draft.osPasscode}
                    onChange={e => updateDraft({ osPasscode: e.target.value })}
                    className="font-mono text-center"
                    dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-right">צבע (אופציונלי)</Label>
                <Input
                    value={draft.color ?? ''}
                    onChange={e => updateDraft({ color: e.target.value })}
                    className="text-right"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-right">IMEI (אופציונלי)</Label>
                <Input
                    value={draft.imei ?? ''}
                    onChange={e => updateDraft({ imei: e.target.value })}
                    className="font-mono text-center"
                    dir="ltr"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-right">תיאור תקלה</Label>
              <Textarea
                  value={draft.issueDescription}
                  onChange={e => updateDraft({ issueDescription: e.target.value })}
                  rows={2}
                  className="text-right"
              />
            </div>

            <div className="grid gap-1.5">
              <Label className="text-right">הערות פנימיות (לעיניך בלבד)</Label>
              <Textarea
                  value={draft.internalNotes}
                  onChange={e => updateDraft({ internalNotes: e.target.value })}
                  rows={3}
                  className="border-dashed text-right bg-yellow-50/50"
                  placeholder="כאן אפשר למחוק ולערוך חופשי..."
              />
            </div>

            {/* Public updates (With Delete Option) */}
            <div className="grid gap-2 border-t pt-4 mt-2">
              <Label className="text-right">עדכונים ללקוח (יופיעו בקישור המעקב)</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {draft.publicUpdates?.map((u, i) => (
                    <div key={i} className="rounded-md bg-muted p-2.5 text-sm flex justify-between items-start group">
                      <div className="text-right flex-1">
                        <span className="font-mono text-xs text-muted-foreground block mb-1">{u.date}</span>
                        <p className="mt-0.5">{u.message}</p>
                      </div>
                      <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePublicUpdate(i)}
                          className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-50 group-hover:opacity-100 transition-opacity"
                          title="מחק עדכון"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                ))}
                {(!draft.publicUpdates || draft.publicUpdates.length === 0) && (
                    <p className="text-sm text-gray-400 text-center py-2">אין עדכונים פומביים כרגע</p>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                    value={newUpdate}
                    onChange={e => setNewUpdate(e.target.value)}
                    placeholder="הוסף עדכון שיפורסם ללקוח..."
                    className="text-right"
                    onKeyDown={e => e.key === 'Enter' && addPublicUpdate()}
                />
                <Button size="icon" variant="outline" onClick={addPublicUpdate} className="shrink-0 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Save button */}
            <Button onClick={handleSave} disabled={!dirty || saving} className="w-full gap-2 mt-4">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'שומר...' : dirty ? 'שמור שינויים' : 'נשמר בהצלחה'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
  );
}