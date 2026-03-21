import { useParams } from 'react-router-dom';
import { usePublicTicket } from '@/context/TicketContext';
import { ProgressStepper } from '@/components/ProgressStepper';
import { MessageCircle, Loader2, SearchX, Wrench, BadgeCheck, Clock3 } from 'lucide-react';

export default function TrackPage() {
  const { tokenId } = useParams<{ tokenId: string }>();
  const { ticket, loading } = usePublicTicket(tokenId);

  // מצב טעינה
  if (loading) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
    );
  }

  // מצב שגיאה
  if (!ticket) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4" dir="rtl">
          <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 mb-4">
              <SearchX className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">קריאה לא נמצאה</h1>
            <p className="text-sm text-gray-500">בדוק את הקישור או צור קשר עם המעבדה.</p>
          </div>
        </div>
    );
  }

  const priceOffer = Number(ticket.price ?? 0);
  const shouldShowPriceOffer = Boolean(ticket.isPricePublic) && Number.isFinite(priceOffer) && priceOffer > 0;
  const formattedPrice = new Intl.NumberFormat('he-IL').format(priceOffer);
  const latestUpdate = ticket.publicUpdates && ticket.publicUpdates.length > 0
      ? ticket.publicUpdates[ticket.publicUpdates.length - 1]
      : null;

  const myPhoneNumber = '972509942508';
  const whatsappMessage = encodeURIComponent(`היי שחר, אני פונה בקשר לתיקון מספר: ${ticket.tokenId}`);

  return (
      <div className="relative min-h-screen bg-slate-950 flex flex-col items-center py-12 px-4 font-sans overflow-hidden" dir="rtl">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute top-1/3 -left-24 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute -bottom-28 right-1/4 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        </div>

        {/* לוגו וכותרת */}
        <div className="mb-8 text-center relative z-10">
          <div className="bg-gradient-to-br from-blue-500 to-violet-500 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/40">
            <Wrench className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">מעבדת התיקונים של שחר</h1>
          <p className="text-blue-100/90 mt-1">מעקב קריאת שירות</p>
        </div>

        <div className="backdrop-blur-xl bg-white/90 w-full max-w-lg rounded-3xl shadow-2xl shadow-black/30 border border-white/60 overflow-hidden relative z-10">

          {/* Header */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-6 text-white text-right">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-white/20 text-white text-xs font-mono px-3 py-1 rounded-full backdrop-blur-sm" dir="ltr">
                #{ticket.tokenId}
              </span>
              <span className="text-gray-300 text-sm">{ticket.customerName}</span>
            </div>
            <h2 className="text-xl font-bold mb-1">{ticket.deviceModel}</h2>
            <p className="text-blue-100/80 text-sm">נמשיך לעדכן אותך כאן בזמן אמת עד סיום התיקון.</p>
            {latestUpdate && (
                <div className="mt-4 rounded-xl bg-white/10 border border-white/15 px-3 py-2 flex items-center gap-2 text-xs text-blue-50">
                  <Clock3 className="w-3.5 h-3.5" />
                  <span>עדכון אחרון: {latestUpdate.date}</span>
                </div>
            )}
          </div>

          <div className="p-6 sm:p-8">

            {/* אזור הצעת מחיר - מוצג רק אם פורסם ללקוח ויש מחיר תקין */}
            {shouldShowPriceOffer && (
                <div className="mb-8 bg-gradient-to-r from-emerald-50 to-green-100 border border-emerald-200/70 rounded-2xl p-6 flex justify-between items-center animate-in fade-in zoom-in duration-500 shadow-lg shadow-emerald-100">
                  <div className="flex flex-col">
                    <span className="text-emerald-900 font-bold text-lg flex items-center gap-2">
                      <BadgeCheck className="w-5 h-5" />
                      סה"כ לתשלום
                    </span>
                    <span className="text-xs text-emerald-700">הצעת מחיר סופית לתיקון</span>
                  </div>
                  <div className="text-3xl font-black text-emerald-700 font-mono tracking-tight">
                    ₪{formattedPrice}
                  </div>
                </div>
            )}

            {/* סטפר */}
            <div className="mb-12">
              <h3 className="text-sm font-semibold text-gray-900 mb-8 border-b pb-2">סטטוס התיקון</h3>
              <ProgressStepper currentStatus={ticket.status} />
            </div>

            {/* היסטוריית עדכונים */}
            {ticket.publicUpdates && ticket.publicUpdates.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-sm font-semibold text-gray-900 mb-6 border-b pb-2">עדכונים מהמעבדה</h3>
                  <div className="relative border-r-2 border-gray-100 pr-4 space-y-6">
                    {[...ticket.publicUpdates].reverse().map((update, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -right-[21px] top-1.5 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-white" />
                          <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-4 border border-slate-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                            <time className="text-xs font-mono text-gray-500 block mb-1.5">{update.date}</time>
                            <p className="text-gray-800 text-sm leading-relaxed">{update.message}</p>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
            )}
          </div>

          {/* WhatsApp Footer */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 border-t border-gray-100 text-center">
            <p className="text-sm text-slate-600 mb-4">צריך עזרה או שיש לך שאלה?</p>
            <a
                href={`https://wa.me/${myPhoneNumber}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
            >
              <MessageCircle className="w-5 h-5" />
              דבר איתי בוואטסאפ
            </a>
          </div>
        </div>
      </div>
  );
}