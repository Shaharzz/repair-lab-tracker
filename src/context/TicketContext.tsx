import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type TicketStatus =
    | 'Received'
    | 'Diagnosing'
    | 'Waiting for Parts'
    | 'In Repair'
    | 'Ready for Pickup'
    | 'Completed';

export const STATUSES: TicketStatus[] = [
  'Received',
  'Diagnosing',
  'Waiting for Parts',
  'In Repair',
  'Ready for Pickup',
  'Completed',
];

export interface PublicUpdate {
  date: string;
  message: string;
}

export interface Ticket {
  id: string;
  tokenId: string;
  customerName: string;
  customerPhone: string;
  deviceModel: string;
  osPasscode: string;
  issueDescription: string;
  internalNotes: string;
  publicUpdates: PublicUpdate[];
  status: TicketStatus;
  dateReceived: string;
  // שדות חדשים שהוספנו:
  price?: number;
  isPricePublic?: boolean;
}

// Public-only ticket (no sensitive fields)
export interface PublicTicket {
  id: string;
  tokenId: string;
  customerName: string;
  deviceModel: string;
  publicUpdates: PublicUpdate[];
  status: TicketStatus;
  dateReceived: string;
  // הוספת השדות גם כאן כדי שיופיעו בדף המעקב
  price?: number;
  isPricePublic?: boolean;
}

function generateTokenId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Map DB row to app Ticket
function rowToTicket(row: any): Ticket {
  const parsedPrice = row.price === null || row.price === undefined ? undefined : Number(row.price);

  return {
    id: row.id,
    tokenId: row.token_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    deviceModel: row.device_model,
    osPasscode: row.os_passcode,
    issueDescription: row.issue_description,
    internalNotes: row.internal_notes,
    publicUpdates: (row.public_updates || []) as PublicUpdate[],
    status: row.status as TicketStatus,
    dateReceived: row.date_received,
    // מיפוי השדות מהמסד לאפליקציה
    price: Number.isFinite(parsedPrice) ? parsedPrice : undefined,
    isPricePublic: Boolean(row.is_price_public ?? row.isPricePublic),
  };
}

interface TicketContextType {
  tickets: Ticket[];
  loading: boolean;
  addTicket: (ticket: Omit<Ticket, 'id' | 'tokenId'>) => Promise<Ticket>;
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  refreshTickets: () => Promise<void>;
}

const TicketContext = createContext<TicketContextType | null>(null);

export function TicketProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshTickets = useCallback(async () => {
    const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

    if (!error && data) {
      setTickets(data.map(rowToTicket));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshTickets();
  }, [refreshTickets]);

  const addTicket = useCallback(async (ticket: Omit<Ticket, 'id' | 'tokenId'>): Promise<Ticket> => {
    const tokenId = generateTokenId();
    const { data, error } = await supabase
        .from('tickets')
        .insert({
          token_id: tokenId,
          customer_name: ticket.customerName,
          customer_phone: ticket.customerPhone,
          device_model: ticket.deviceModel,
          os_passcode: ticket.osPasscode,
          issue_description: ticket.issueDescription,
          internal_notes: ticket.internalNotes,
          public_updates: ticket.publicUpdates as any,
          status: ticket.status,
          date_received: ticket.dateReceived,
          price: ticket.price,
          is_price_public: ticket.isPricePublic,
        })
        .select()
        .single();

    if (error) throw error;
    const newTicket = rowToTicket(data);
    setTickets(prev => [newTicket, ...prev]);
    return newTicket;
  }, []);

  const updateTicket = useCallback(async (id: string, updates: Partial<Ticket>) => {
    const dbUpdates: any = {};
    if (updates.customerName !== undefined) dbUpdates.customer_name = updates.customerName;
    if (updates.customerPhone !== undefined) dbUpdates.customer_phone = updates.customerPhone;
    if (updates.deviceModel !== undefined) dbUpdates.device_model = updates.deviceModel;
    if (updates.osPasscode !== undefined) dbUpdates.os_passcode = updates.osPasscode;
    if (updates.issueDescription !== undefined) dbUpdates.issue_description = updates.issueDescription;
    if (updates.internalNotes !== undefined) dbUpdates.internal_notes = updates.internalNotes;
    if (updates.publicUpdates !== undefined) dbUpdates.public_updates = updates.publicUpdates;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.dateReceived !== undefined) dbUpdates.date_received = updates.dateReceived;

    // הוספת השדות החדשים לשליחה למסד הנתונים
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.isPricePublic !== undefined) dbUpdates.is_price_public = updates.isPricePublic;

    const { error } = await supabase
        .from('tickets')
        .update(dbUpdates)
        .eq('id', id);

    if (error) throw error;
    setTickets(prev =>
        prev.map(t => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  return (
      <TicketContext.Provider value={{ tickets, loading, addTicket, updateTicket, refreshTickets }}>
        {children}
      </TicketContext.Provider>
  );
}

export function useTickets() {
  const ctx = useContext(TicketContext);
  if (!ctx) throw new Error('useTickets must be used within TicketProvider');
  return ctx;
}

// Hook for public tracking
// Hook for public tracking
export function usePublicTicket(tokenId: string | undefined) {
  const [ticket, setTicket] = useState<PublicTicket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase.rpc('get_ticket_by_token', { p_token_id: tokenId }).then(({ data, error }) => {
      // הדפסה לבדיקת תקלות - תסתכל ב-Console אם הדף ריק!
      console.log("Supabase Data:", data);
      console.log("Supabase Error:", error);

      if (!error && data) {
        // בגלל ה-SQL החדש, data הוא בוודאות אובייקט בודד ולא מערך
        const d = data as any;

        setTicket({
          id: d.id,
          tokenId: d.token_id,
          customerName: d.customer_name,
          deviceModel: d.device_model,
          publicUpdates: (d.public_updates || []) as PublicUpdate[],
          status: d.status as TicketStatus,
          dateReceived: d.date_received,
          // שליפת המחיר בצורה בטוחה
          price: d.price ? Number(d.price) : undefined,
          isPricePublic: Boolean(d.is_price_public || d.isPricePublic),
        });
      } else {
        setTicket(null);
      }
      setLoading(false);
    });
  }, [tokenId]);

  return { ticket, loading };
}