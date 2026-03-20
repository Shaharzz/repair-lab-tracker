import React, { createContext, useContext, useState, useCallback } from 'react';

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
  id: number;
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

function generateTokenId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const MOCK_TICKETS: Ticket[] = [
  {
    id: 1,
    tokenId: 'xK9p2mQv1L',
    customerName: 'Sarah Mitchell',
    customerPhone: '+1 (555) 234-8901',
    deviceModel: 'MacBook Air M2 (A2681)',
    osPasscode: '4829',
    issueDescription: 'Dead, no power',
    internalNotes: 'Board swap needed. Sourced replacement C-shell + display for approx $230.',
    publicUpdates: [
      { date: '2024-03-15', message: 'Device received and inspection started.' },
      { date: '2024-03-16', message: 'Diagnosis complete — logic board failure confirmed. Ordering replacement parts.' },
    ],
    status: 'Waiting for Parts',
    dateReceived: '2024-03-15',
  },
  {
    id: 2,
    tokenId: 'Rj7wN3kY5d',
    customerName: 'Marcus Chen',
    customerPhone: '+1 (555) 876-4320',
    deviceModel: 'Custom PC (R7 5700X, 32GB RAM, RX 5700 XT)',
    osPasscode: '',
    issueDescription: 'Drive clicking, missing files',
    internalNotes: 'Data recovery in progress. Repairing corrupted video frames.',
    publicUpdates: [
      { date: '2024-03-12', message: 'System received. Running initial diagnostics.' },
      { date: '2024-03-13', message: 'Hard drive failure detected. Starting data recovery process.' },
      { date: '2024-03-14', message: 'Recovery underway — approximately 78% of data retrieved so far.' },
    ],
    status: 'In Repair',
    dateReceived: '2024-03-12',
  },
];

interface TicketContextType {
  tickets: Ticket[];
  addTicket: (ticket: Omit<Ticket, 'id' | 'tokenId'>) => Ticket;
  updateTicket: (id: number, updates: Partial<Ticket>) => void;
  getTicketByToken: (tokenId: string) => Ticket | undefined;
}

const TicketContext = createContext<TicketContextType | null>(null);

export function TicketProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);

  const addTicket = useCallback((ticket: Omit<Ticket, 'id' | 'tokenId'>) => {
    const newTicket: Ticket = {
      ...ticket,
      id: Date.now(),
      tokenId: generateTokenId(),
    };
    setTickets(prev => [...prev, newTicket]);
    return newTicket;
  }, []);

  const updateTicket = useCallback((id: number, updates: Partial<Ticket>) => {
    setTickets(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const getTicketByToken = useCallback(
    (tokenId: string) => tickets.find(t => t.tokenId === tokenId),
    [tickets]
  );

  return (
    <TicketContext.Provider value={{ tickets, addTicket, updateTicket, getTicketByToken }}>
      {children}
    </TicketContext.Provider>
  );
}

export function useTickets() {
  const ctx = useContext(TicketContext);
  if (!ctx) throw new Error('useTickets must be used within TicketProvider');
  return ctx;
}
