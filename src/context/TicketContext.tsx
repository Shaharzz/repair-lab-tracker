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

// Hook for public tracking — uses the security definer function
export function usePublicTicket(tokenId: string | undefined) {
  const [ticket, setTicket] = useState<PublicTicket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenId) {
      setLoading(false);
      return;
    }

    supabase.rpc('get_ticket_by_token', { p_token_id: tokenId }).then(({ data, error }) => {
      if (!error && data) {
        const d = data as any;
        setTicket({
          id: d.id,
          tokenId: d.token_id,
          customerName: d.customer_name,
          deviceModel: d.device_model,
          publicUpdates: (d.public_updates || []) as PublicUpdate[],
          status: d.status as TicketStatus,
          dateReceived: d.date_received,
        });
      }
      setLoading(false);
    });
  }, [tokenId]);

  return { ticket, loading };
}
