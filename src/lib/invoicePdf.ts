type InvoiceLineItem = {
  description: string;
  qty: number;
  unit_price: number;
};

type HebrewInvoiceData = {
  invoiceNumber: string;
  customerName: string;
  issueDate: string;
  paymentMethod: string;
  status: string;
  totalAmount: number;
  lineItems: InvoiceLineItem[];
};

function formatMoney(value: number): string {
  return `${value.toFixed(2)} ש"ח`;
}

function buildRows(items: InvoiceLineItem[]): string {
  return items
    .map(item => {
      const lineTotal = item.qty * item.unit_price;
      return `
        <tr>
          <td>${item.description}</td>
          <td>${item.qty}</td>
          <td>${formatMoney(item.unit_price)}</td>
          <td>${formatMoney(lineTotal)}</td>
        </tr>
      `;
    })
    .join('');
}

function buildHebrewInvoiceHtml(data: HebrewInvoiceData): string {
  return `
  <!doctype html>
  <html lang="he" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <title>חשבונית ${data.invoiceNumber}</title>
      <style>
        body {
          font-family: Arial, Helvetica, sans-serif;
          margin: 24px;
          color: #111827;
          direction: rtl;
        }
        .header {
          margin-bottom: 16px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }
        .title {
          font-size: 24px;
          margin: 0;
        }
        .sub {
          margin: 4px 0 0;
          color: #4b5563;
        }
        .meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 14px;
        }
        .meta div {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
        }
        th, td {
          border: 1px solid #e5e7eb;
          padding: 10px;
          text-align: right;
          font-size: 14px;
        }
        thead {
          background: #f3f4f6;
        }
        .total {
          margin-top: 16px;
          font-weight: 700;
          font-size: 18px;
        }
        .footer {
          margin-top: 30px;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">חשבונית</h1>
        <p class="sub">RepairLab</p>
      </div>

      <div class="meta">
        <div><strong>מספר חשבונית:</strong> ${data.invoiceNumber}</div>
        <div><strong>תאריך הנפקה:</strong> ${data.issueDate}</div>
        <div><strong>שם לקוח:</strong> ${data.customerName}</div>
        <div><strong>אמצעי תשלום:</strong> ${data.paymentMethod}</div>
        <div><strong>סטטוס:</strong> ${data.status}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>תיאור</th>
            <th>כמות</th>
            <th>מחיר יחידה</th>
            <th>סה"כ שורה</th>
          </tr>
        </thead>
        <tbody>
          ${buildRows(data.lineItems)}
        </tbody>
      </table>

      <p class="total">סה"כ לתשלום: ${formatMoney(data.totalAmount)}</p>
      <p class="footer">המסמך נוצר אוטומטית ממערכת הניהול.</p>

      <script>
        window.onload = function () {
          window.print();
        };
      </script>
    </body>
  </html>
  `;
}

export function openHebrewInvoicePdf(data: HebrewInvoiceData): void {
  const invoiceWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
  if (!invoiceWindow) return;

  invoiceWindow.document.open();
  invoiceWindow.document.write(buildHebrewInvoiceHtml(data));
  invoiceWindow.document.close();
}

export type { HebrewInvoiceData, InvoiceLineItem };

