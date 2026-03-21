import { TicketStatus } from '@/context/TicketContext';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

// אנחנו מגדירים מערך מסודר של הסטטוסים עם השמות בעברית, כדי שהסדר שלהם על הציר יהיה נכון.
// שימו לב: מכיוון שאנחנו ב-RTL, הסטטוס הראשון (Received) יופיע מימין, והאחרון (Completed) משמאל.
const STEPS_CONFIG = [
    { id: 'Received', label: 'התקבל' },
    { id: 'Diagnosing', label: 'באבחון' },
    { id: 'Waiting for Parts', label: 'ממתין לחלקים' },
    { id: 'In Repair', label: 'בתיקון' },
    { id: 'Ready for Pickup', label: 'מוכן לאיסוף' },
    { id: 'Completed', label: 'הושלם' },
] as const;

interface Props {
    currentStatus: TicketStatus;
}

export function ProgressStepper({ currentStatus }: Props) {
    // מוצאים את המפתח של הסטטוס הנוכחי כדי לדעת עד לאן לצבוע את הציר
    const currentIndex = STEPS_CONFIG.findIndex(step => step.id === currentStatus);

    return (
        <div className="w-full font-sans" dir="rtl">
            {/* Container המרכזי עם Flexbox למירכוז וריווח אוטומטי */}
            <div className="flex items-center justify-between relative w-full px-1">

                {/* ציר התקדמות - פס הרקע האפור */}
                <div className="absolute top-[18px] left-0 right-0 h-1 bg-gray-100 rounded-full z-0 mx-6" />

                {/* ציר התקדמות - הפס הכחול שמתמלא (Flex grow) */}
                <div
                    className="absolute top-[18px] right-6 h-1 bg-blue-600 rounded-full z-0 transition-all duration-500 ease-out"
                    style={{
                        // מחשבים את אחוז המילוי של הפס הכחול על פי הסטטוס
                        width: `calc(${ (currentIndex / (STEPS_CONFIG.length - 1)) * 100 }% - 12px)`
                    }}
                />

                {/* לולאה ליצירת הכדורים והתוויות */}
                {STEPS_CONFIG.map((step, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;

                    return (
                        <div key={step.id} className="flex flex-col items-center group relative z-10 flex-1">
                            {/* כדור הסטטוס */}
                            <div
                                className={cn(
                                    "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm",
                                    // סטטוס שבוצע: כחול מלא עם וי
                                    isCompleted && "bg-blue-600 border-blue-600 text-white",
                                    // סטטוס נוכחי: עיגול כחול עם כיתוב בפנים (כמו בתמונה המקורית)
                                    isCurrent && "bg-blue-50 border-blue-600 text-blue-600 font-bold",
                                    // סטטוס שעוד לא בוצע: אפור ניטרלי
                                    !isCompleted && !isCurrent && "bg-white border-gray-200 text-gray-400"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="w-5 h-5" strokeWidth={3} />
                                ) : (
                                    // מציגים את מספר הסטטוס (מ-1 עד 6)
                                    <span className="text-sm">{index + 1}</span>
                                )}
                            </div>

                            {/* תווית הטקסט מעודכנת */}
                            <span
                                className={cn(
                                    "absolute top-11 text-center whitespace-normal leading-tight text-[11px] sm:text-xs max-w-[80px] break-words",
                                    // טקסט מודגש רק לסטטוס הנוכחי
                                    isCurrent ? "font-semibold text-gray-900" : "font-normal text-gray-500"
                                )}
                            >
                {step.label}
              </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}