import { STATUSES, type TicketStatus } from '@/context/TicketContext';
import { Check } from 'lucide-react';

export function ProgressStepper({ currentStatus }: { currentStatus: TicketStatus }) {
  const currentIndex = STATUSES.indexOf(currentStatus);

  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden sm:flex items-center justify-between">
        {STATUSES.map((status, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={status} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-500 ${
                    isDone
                      ? 'bg-primary text-primary-foreground'
                      : isCurrent
                      ? 'bg-primary text-primary-foreground tech-glow-sm'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={`text-[10px] leading-tight text-center max-w-[72px] ${
                    isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {status}
                </span>
              </div>
              {i < STATUSES.length - 1 && (
                <div
                  className={`mx-1 h-0.5 flex-1 rounded-full transition-colors duration-500 ${
                    i < currentIndex ? 'bg-primary' : 'bg-border'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile — vertical */}
      <div className="flex flex-col gap-0 sm:hidden">
        {STATUSES.map((status, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={status} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    isDone
                      ? 'bg-primary text-primary-foreground'
                      : isCurrent
                      ? 'bg-primary text-primary-foreground tech-glow-sm'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                {i < STATUSES.length - 1 && (
                  <div
                    className={`w-0.5 h-6 ${i < currentIndex ? 'bg-primary' : 'bg-border'}`}
                  />
                )}
              </div>
              <span
                className={`text-sm pt-1 ${
                  isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'
                }`}
              >
                {status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
