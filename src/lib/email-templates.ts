import { site } from '@/config/site';
import { escapeHtml, formatPrice } from '@/lib/utils';

function layout(content: string): string {
  return `
    <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Roboto,sans-serif;color:#1f2937;">
      <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:24px 32px;border-radius:12px 12px 0 0;">
        <h1 style="color:#fff;font-size:20px;margin:0;font-weight:700;">${site.name}</h1>
      </div>
      <div style="background:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        ${content}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="font-size:12px;color:#9ca3af;margin:0;">
          ${site.team}<br />
          ${site.contact.email} | ${site.contact.phone}<br />
          <a href="${site.url}" style="color:#2563eb;text-decoration:none;">${site.url.replace('https://', '')}</a>
        </p>
        <p style="font-size:11px;color:#d1d5db;margin:8px 0 0;">
          Primesti acest email deoarece ai plasat o comanda sau ai interactionat cu ${site.name}.
        </p>
      </div>
    </div>
  `.trim();
}

interface OrderEmailData {
  orderNumber: number;
  total: number;
  paymentMethod: string;
  shippingMethod?: string;
  items?: { name: string; quantity: number; unitPrice: number }[];
}

export function orderConfirmationEmail(data: OrderEmailData): { subject: string; html: string } {
  const itemsHtml = data.items?.length
    ? `<table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr style="border-bottom:2px solid #e5e7eb;">
            <th style="text-align:left;padding:8px 0;font-size:13px;color:#6b7280;">Produs</th>
            <th style="text-align:center;padding:8px;font-size:13px;color:#6b7280;">Cant.</th>
            <th style="text-align:right;padding:8px 0;font-size:13px;color:#6b7280;">Pret</th>
          </tr>
        </thead>
        <tbody>
          ${data.items
            .map(
              (item) => `
            <tr style="border-bottom:1px solid #f3f4f6;">
              <td style="padding:8px 0;font-size:14px;">${escapeHtml(item.name)}</td>
              <td style="text-align:center;padding:8px;font-size:14px;">${item.quantity}</td>
              <td style="text-align:right;padding:8px 0;font-size:14px;">${formatPrice(item.unitPrice * item.quantity)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>`
    : '';

  return {
    subject: `Comanda #EA-${data.orderNumber} confirmata`,
    html: layout(`
      <h2 style="font-size:18px;color:#1f2937;margin:0 0 8px;">Multumim pentru comanda!</h2>
      <p style="font-size:14px;color:#4b5563;margin:0 0 16px;">
        Comanda ta <strong>#EA-${data.orderNumber}</strong> a fost confirmata.
      </p>
      ${itemsHtml}
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 4px;font-size:14px;"><strong>Total:</strong> ${formatPrice(data.total)}</p>
        <p style="margin:0 0 4px;font-size:14px;"><strong>Plata:</strong> ${data.paymentMethod === 'card' ? 'Card bancar' : 'Ramburs (la livrare)'}</p>
        <p style="margin:0;font-size:14px;"><strong>Livrare:</strong> ${data.shippingMethod === 'easybox' ? 'EasyBox (locker)' : 'Curier la adresa'}</p>
      </div>
      <p style="font-size:14px;color:#4b5563;margin:0;">
        Poti urmari statusul comenzii in <a href="${site.url}/comenzi" style="color:#2563eb;text-decoration:underline;">contul tau</a>.
      </p>
    `),
  };
}

export function orderStatusUpdateEmail(
  orderNumber: number,
  newStatus: string,
): { subject: string; html: string } {
  const statusMessages: Record<string, { title: string; body: string }> = {
    confirmed: {
      title: 'Comanda ta a fost confirmata',
      body: 'Comanda ta a fost confirmata si urmeaza sa fie pregatita pentru expediere.',
    },
    shipped: {
      title: 'Comanda ta a fost expediata',
      body: 'Comanda ta a fost expediata! O vei primi in curand.',
    },
    delivered: {
      title: 'Comanda ta a fost livrata',
      body: 'Comanda ta a fost livrata cu succes. Multumim ca ai cumparat de la electricAcasa!',
    },
    cancelled: {
      title: 'Comanda ta a fost anulata',
      body: 'Comanda ta a fost anulata. Daca ai intrebari, contacteaza-ne.',
    },
  };

  const msg = statusMessages[newStatus] || {
    title: 'Status comanda actualizat',
    body: `Statusul comenzii a fost schimbat la: ${newStatus}.`,
  };

  return {
    subject: `${msg.title} - EA-${orderNumber}`,
    html: layout(`
      <h2 style="font-size:18px;color:#1f2937;margin:0 0 8px;">${escapeHtml(msg.title)}</h2>
      <p style="font-size:14px;color:#4b5563;margin:0 0 16px;">${escapeHtml(msg.body)}</p>
      <p style="font-size:14px;color:#4b5563;margin:0;">
        Comanda <strong>#EA-${orderNumber}</strong> —
        <a href="${site.url}/comenzi" style="color:#2563eb;text-decoration:underline;">vezi detalii</a>
      </p>
    `),
  };
}

export function contactFormEmail(
  name: string,
  email: string,
  message: string,
): { subject: string; html: string } {
  return {
    subject: `Mesaj de contact de la ${name}`,
    html: layout(`
      <h2 style="font-size:18px;color:#1f2937;margin:0 0 16px;">Mesaj nou de pe site</h2>
      <p style="font-size:14px;margin:0 0 4px;"><strong>Nume:</strong> ${escapeHtml(name)}</p>
      <p style="font-size:14px;margin:0 0 16px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
      <div style="background:#f9fafb;border-radius:8px;padding:16px;">
        <p style="font-size:14px;color:#4b5563;margin:0;white-space:pre-line;">${escapeHtml(message)}</p>
      </div>
    `),
  };
}

interface PackageOfferEmailData {
  clientName: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  total: number;
  offerNotes: string | null;
}

export function packageOfferEmail(data: PackageOfferEmailData): { subject: string; html: string } {
  const itemsHtml = `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <thead>
        <tr style="border-bottom:2px solid #e5e7eb;">
          <th style="text-align:left;padding:8px 0;font-size:13px;color:#6b7280;">Produs</th>
          <th style="text-align:center;padding:8px;font-size:13px;color:#6b7280;">Cant.</th>
          <th style="text-align:right;padding:8px;font-size:13px;color:#6b7280;">Pret unitar</th>
          <th style="text-align:right;padding:8px 0;font-size:13px;color:#6b7280;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${data.items
          .map(
            (item) => `
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:8px 0;font-size:14px;">${escapeHtml(item.name)}</td>
            <td style="text-align:center;padding:8px;font-size:14px;">${item.quantity}</td>
            <td style="text-align:right;padding:8px;font-size:14px;">${formatPrice(item.unitPrice)}</td>
            <td style="text-align:right;padding:8px 0;font-size:14px;">${formatPrice(item.unitPrice * item.quantity)}</td>
          </tr>
        `,
          )
          .join('')}
      </tbody>
    </table>`;

  const notesHtml = data.offerNotes
    ? `<div style="background:#f0f9ff;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
        <p style="font-size:13px;color:#6b7280;margin:0 0 4px;font-weight:600;">Mesaj de la echipa noastra:</p>
        <p style="font-size:14px;color:#1f2937;margin:0;white-space:pre-line;">${escapeHtml(data.offerNotes)}</p>
      </div>`
    : '';

  return {
    subject: `Oferta ta de pachet personalizat — ${site.name}`,
    html: layout(`
      <h2 style="font-size:18px;color:#1f2937;margin:0 0 8px;">Salut, ${escapeHtml(data.clientName)}!</h2>
      <p style="font-size:14px;color:#4b5563;margin:0 0 16px;">
        Am pregatit oferta pentru cererea ta de pachet personalizat.
      </p>
      ${itemsHtml}
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;font-size:16px;font-weight:700;color:#1f2937;">Total: ${formatPrice(data.total)}</p>
      </div>
      ${notesHtml}
      <div style="text-align:center;margin:24px 0;">
        <a href="${site.url}/cereri-pachet" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;">
          Vezi oferta
        </a>
      </div>
      <p style="font-size:13px;color:#9ca3af;margin:16px 0 0;text-align:center;">
        Poti accepta sau refuza oferta din contul tau.
      </p>
    `),
  };
}
