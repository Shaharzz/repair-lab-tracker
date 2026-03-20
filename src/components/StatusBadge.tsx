import type { TicketStatus } from '@/context/TicketContext';

const statusConfig: Record<TicketStatus, { bg: string; text: string; dot: string }> = {
  'Received': { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-status-received' },
  'Diagnosing': { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-status-diagnosing' },
  'Waiting for Parts': { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', dot: 'bg-status-waiting' },
  'In Repair': { bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', dot: 'bg-status-repair' },
  'Ready for Pickup': { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-status-ready' },
  'Completed': { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-status-completed' },
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
}
