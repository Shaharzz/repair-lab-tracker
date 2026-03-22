import React from 'react';
import type { InvoiceLineItem } from '@/lib/invoicePdf';

export interface InvoicePrintData {
  invoiceNumber: string;
  customerName: string;
  issueDate: string;
  paymentMethod: string;
  status: string;
  totalAmount: number;
  lineItems: InvoiceLineItem[];
}

interface InvoicePrintDocumentProps {
  data: InvoicePrintData;
}

function formatMoney(value: number): string {
  return `${value.toFixed(2)} ש"ח`;
}

export const InvoicePrintDocument = React.forwardRef<HTMLDivElement, InvoicePrintDocumentProps>(
  ({ data }, ref) => {
    return (
      <div ref={ref} dir="rtl" style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#111827', padding: 24 }}>
        <div style={{ marginBottom: 16, borderBottom: '2px solid #e5e7eb', paddingBottom: 10 }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>חשבונית</h1>
          <p style={{ margin: '4px 0 0', color: '#4b5563' }}>RepairLab</p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 14,
            fontSize: 14
          }}
        >
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px' }}>
            <strong>מספר חשבונית:</strong> {data.invoiceNumber}
          </div>
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px' }}>
            <strong>תאריך הנפקה:</strong> {data.issueDate}
          </div>
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px' }}>
            <strong>שם לקוח:</strong> {data.customerName}
          </div>
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px' }}>
            <strong>אמצעי תשלום:</strong> {data.paymentMethod}
          </div>
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px' }}>
            <strong>סטטוס:</strong> {data.status}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
          <thead style={{ background: '#f3f4f6' }}>
            <tr>
              <th style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'right', fontSize: 14 }}>תיאור</th>
              <th style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'right', fontSize: 14 }}>כמות</th>
              <th style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'right', fontSize: 14 }}>מחיר יחידה</th>
              <th style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'right', fontSize: 14 }}>סה"כ שורה</th>
            </tr>
          </thead>
          <tbody>
            {data.lineItems.map(item => {
              const lineTotal = item.qty * item.unit_price;
              return (
                <tr key={`${item.description}-${lineTotal}`}>
                  <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'right', fontSize: 14 }}>
                    {item.description}
                  </td>
                  <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'right', fontSize: 14 }}>
                    {item.qty}
                  </td>
                  <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'right', fontSize: 14 }}>
                    {formatMoney(item.unit_price)}
                  </td>
                  <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'right', fontSize: 14 }}>
                    {formatMoney(lineTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p style={{ marginTop: 16, fontWeight: 700, fontSize: 18 }}>סה"כ לתשלום: {formatMoney(data.totalAmount)}</p>
        <p style={{ marginTop: 30, color: '#6b7280', fontSize: 12 }}>המסמך נוצר אוטומטית ממערכת הניהול.</p>
      </div>
    );
  }
);

InvoicePrintDocument.displayName = 'InvoicePrintDocument';

