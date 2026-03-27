'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatPrice } from '@/lib/utils';
import { ChevronDown, ChevronUp, Package, CheckCircle, XCircle } from 'lucide-react';
import type { PackageRequestWithItems, OfferStatus } from '@/types/database';
import { offerStatusLabels, offerStatusVariants, requestStatusLabels } from '@/lib/order-helpers';

interface Props {
  requests: PackageRequestWithItems[];
}

export default function CereriPachetContent({ requests: initialRequests }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [confirmAccept, setConfirmAccept] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  async function handleAccept(requestId: string) {
    setAccepting(true);
    try {
      const res = await fetch('/api/package-offer/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Eroare la acceptarea ofertei', 'error');
        return;
      }
      toast('Oferta acceptata! Comanda a fost creata.', 'success');
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, offer_status: 'accepted' as OfferStatus } : r,
        ),
      );
      setConfirmAccept(null);
      router.push(`/comenzi/${data.orderId}`);
    } catch {
      toast('Eroare de retea', 'error');
    } finally {
      setAccepting(false);
    }
  }

  async function handleReject(requestId: string) {
    setRejecting(true);
    try {
      const res = await fetch('/api/package-offer/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Eroare', 'error');
        return;
      }
      toast('Oferta refuzata.', 'success');
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, offer_status: 'rejected' as OfferStatus } : r,
        ),
      );
    } catch {
      toast('Eroare de retea', 'error');
    } finally {
      setRejecting(false);
    }
  }

  if (requests.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <Package size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Nicio cerere de pachet</h2>
        <p className="text-gray-500">Nu ai trimis inca nicio cerere de pachet personalizat.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Cererile mele de pachet</h1>

      {requests.map((req) => (
        <Card key={req.id}>
          <button
            onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
            className="w-full text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm text-gray-500">{formatDate(req.created_at)}</span>
                  <Badge variant="info">{requestStatusLabels[req.status] || req.status}</Badge>
                  {req.offer_status && (
                    <Badge variant={offerStatusVariants[req.offer_status]}>
                      {offerStatusLabels[req.offer_status]}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-700 line-clamp-1">
                  {req.description.slice(0, 100)}
                </p>
              </div>
              {expandedId === req.id ? (
                <ChevronUp size={18} className="text-gray-400 shrink-0" />
              ) : (
                <ChevronDown size={18} className="text-gray-400 shrink-0" />
              )}
            </div>
          </button>

          {expandedId === req.id && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  Descrierea cererii
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{req.description}</p>
              </div>

              {/* Offer section */}
              {req.offer_status && req.package_offer_items.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Oferta</p>
                    <Badge variant={offerStatusVariants[req.offer_status]}>
                      {offerStatusLabels[req.offer_status]}
                    </Badge>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">
                            Produs
                          </th>
                          <th className="text-center py-2 text-xs font-semibold text-gray-500 uppercase">
                            Cant.
                          </th>
                          <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">
                            Pret
                          </th>
                          <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {req.package_offer_items.map((item) => (
                          <tr key={item.id} className="border-b border-gray-100">
                            <td className="py-2 text-gray-700">{item.product_name}</td>
                            <td className="py-2 text-center text-gray-700">{item.quantity}</td>
                            <td className="py-2 text-right text-gray-700">
                              {formatPrice(item.unit_price)}
                            </td>
                            <td className="py-2 text-right font-medium text-gray-900">
                              {formatPrice(item.unit_price * item.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-base md:text-lg font-bold text-primary">
                      {formatPrice(req.offer_total ?? 0)}
                    </span>
                  </div>

                  {req.offer_notes && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-600 mb-1">
                        Mesaj de la echipa:
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{req.offer_notes}</p>
                    </div>
                  )}

                  {/* Accept/Reject buttons */}
                  {req.offer_status === 'pending' && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      {confirmAccept === req.id ? (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
                          <p className="text-sm text-gray-600 flex-1">
                            Confirmi acceptarea ofertei de{' '}
                            <strong>{formatPrice(req.offer_total ?? 0)}</strong>? Se va crea o
                            comanda.
                          </p>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleAccept(req.id)}
                            loading={accepting}
                          >
                            <CheckCircle size={16} className="mr-1" /> Da, accept
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmAccept(null)}>
                            Anuleaza
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => setConfirmAccept(req.id)}
                          >
                            <CheckCircle size={16} className="mr-1" /> Accepta oferta
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReject(req.id)}
                            loading={rejecting}
                          >
                            <XCircle size={16} className="mr-1" /> Refuza
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* No offer yet */}
              {!req.offer_status && (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-500">
                    Cererea este in curs de analiza. Te vom notifica cand oferta este gata.
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
