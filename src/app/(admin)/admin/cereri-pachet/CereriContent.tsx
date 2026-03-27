'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { AdminPageShell } from '@/components/ui/AdminPageShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatPrice } from '@/lib/utils';
import { FilterBar } from '@/components/ui/filters/FilterBar';
import { FilterSearch } from '@/components/ui/filters/FilterSearch';
import { FilterSelect } from '@/components/ui/filters/FilterSelect';
import { FilterReset } from '@/components/ui/filters/FilterReset';
import {
  Download,
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
  Trash2,
  Send,
  XCircle,
} from 'lucide-react';
import type {
  PackageRequest,
  PackageRequestStatus,
  PackageOfferItem,
  OfferStatus,
} from '@/types/database';

type RequestWithItems = PackageRequest & {
  package_offer_items: PackageOfferItem[];
  offer_total: number | null;
  offer_status: OfferStatus | null;
  offer_created_at: string | null;
  offer_notes: string | null;
};

interface OfferItemDraft {
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface ProductSearchResult {
  id: string;
  name: string;
  price: number;
  sale_price: number | null;
  stock: number;
}

interface Props {
  requests: RequestWithItems[];
}

const statusLabels: Record<PackageRequestStatus, string> = {
  new: 'Noua',
  in_review: 'In analiza',
  answered: 'Raspuns',
  closed: 'Inchisa',
};
const statusVariants: Record<PackageRequestStatus, 'warning' | 'info' | 'success' | 'neutral'> = {
  new: 'warning',
  in_review: 'info',
  answered: 'success',
  closed: 'neutral',
};
const STATUS_OPTIONS: PackageRequestStatus[] = ['new', 'in_review', 'answered', 'closed'];

const FILTER_OPTIONS = [
  { value: 'new', label: 'Noua' },
  { value: 'in_review', label: 'In analiza' },
  { value: 'answered', label: 'Raspuns' },
  { value: 'closed', label: 'Inchisa' },
];

export default function CereriContent({ requests: initialRequests }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<PackageRequestStatus>('new');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Offer state
  const [offerItemsDraft, setOfferItemsDraft] = useState<OfferItemDraft[]>([]);
  const [offerNotesDraft, setOfferNotesDraft] = useState('');
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState<ProductSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingOffer, setSendingOffer] = useState(false);
  const [closingOffer, setClosingOffer] = useState(false);

  const hasFilters = search !== '' || filter !== 'all';

  const filtered = requests.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.name.toLowerCase().includes(q) &&
        !r.email.toLowerCase().includes(q) &&
        !(r.phone || '').includes(q)
      )
        return false;
    }
    if (filter !== 'all' && r.status !== filter) return false;
    return true;
  });

  function resetFilters() {
    setSearch('');
    setFilter('all');
  }

  function expand(req: RequestWithItems) {
    if (expandedId === req.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(req.id);
    setEditStatus(req.status);
    setEditNotes(req.admin_notes || '');
    setShowOfferForm(false);
    setProductQuery('');
    setProductResults([]);
    // Load existing offer items into draft
    if (req.package_offer_items?.length > 0) {
      setOfferItemsDraft(
        req.package_offer_items.map((i) => ({
          productId: i.product_id,
          productName: i.product_name,
          quantity: i.quantity,
          unitPrice: i.unit_price,
        })),
      );
      setOfferNotesDraft(req.offer_notes || '');
    } else {
      setOfferItemsDraft([]);
      setOfferNotesDraft('');
    }
  }

  async function handleSave(reqId: string) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('package_requests')
      .update({ status: editStatus, admin_notes: editNotes.trim() || null })
      .eq('id', reqId);

    if (error) {
      toast(`Eroare: ${error.message}`, 'error');
    } else {
      toast('Cerere actualizata', 'success');
      setRequests((prev) =>
        prev.map((r) =>
          r.id === reqId ? { ...r, status: editStatus, admin_notes: editNotes.trim() || null } : r,
        ),
      );
    }
    setSaving(false);
  }

  async function downloadAttachment(reqId: string) {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/admin/attachment-url?requestId=${reqId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    if (res.ok && data.url) {
      window.open(data.url, '_blank');
    } else {
      toast(data.error || 'Eroare la descarcare', 'error');
    }
  }

  async function searchProducts(query: string) {
    setProductQuery(query);
    if (query.length < 2) {
      setProductResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/product-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setProductResults(data.products || []);
    } catch {
      setProductResults([]);
    } finally {
      setSearching(false);
    }
  }

  function addCatalogProduct(product: ProductSearchResult) {
    setOfferItemsDraft((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.sale_price ?? product.price,
      },
    ]);
    setProductQuery('');
    setProductResults([]);
  }

  function addCustomItem() {
    setOfferItemsDraft((prev) => [
      ...prev,
      {
        productId: null,
        productName: '',
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  }

  function removeOfferItem(index: number) {
    setOfferItemsDraft((prev) => prev.filter((_, i) => i !== index));
  }

  function updateOfferItem(index: number, field: keyof OfferItemDraft, value: string | number) {
    setOfferItemsDraft((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  async function sendOffer(reqId: string) {
    if (offerItemsDraft.length === 0) {
      toast('Adauga cel putin un produs', 'error');
      return;
    }
    for (const item of offerItemsDraft) {
      if (!item.productName.trim()) {
        toast('Completeaza numele tuturor produselor', 'error');
        return;
      }
    }
    setSendingOffer(true);
    try {
      const res = await fetch('/api/admin/package-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: reqId,
          items: offerItemsDraft.map((i) => ({
            productId: i.productId || undefined,
            productName: i.productName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
          offerNotes: offerNotesDraft.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Eroare', 'error');
        return;
      }
      toast('Oferta trimisa cu succes!', 'success');
      setRequests((prev) =>
        prev.map((r) =>
          r.id === reqId
            ? {
                ...r,
                status: 'answered' as PackageRequestStatus,
                offer_status: 'pending' as OfferStatus,
                offer_total: data.offerTotal,
                offer_notes: offerNotesDraft.trim() || null,
                offer_created_at: new Date().toISOString(),
                package_offer_items: offerItemsDraft.map((item, idx) => ({
                  id: `temp-${idx}`,
                  request_id: reqId,
                  product_id: item.productId,
                  product_name: item.productName,
                  quantity: item.quantity,
                  unit_price: item.unitPrice,
                  created_at: new Date().toISOString(),
                })),
              }
            : r,
        ),
      );
      setShowOfferForm(false);
    } catch {
      toast('Eroare de retea', 'error');
    } finally {
      setSendingOffer(false);
    }
  }

  async function closeOffer(reqId: string) {
    setClosingOffer(true);
    try {
      const res = await fetch('/api/admin/package-offer/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: reqId }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast(data.error || 'Eroare', 'error');
        return;
      }
      toast('Oferta inchisa', 'success');
      setRequests((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, offer_status: 'closed' as OfferStatus } : r)),
      );
    } catch {
      toast('Eroare de retea', 'error');
    } finally {
      setClosingOffer(false);
    }
  }

  return (
    <AdminPageShell title="Cereri pachet" description={`${requests.length} cereri total`}>
      <FilterBar>
        <FilterSearch
          value={search}
          onChange={setSearch}
          placeholder="Cauta nume, email, telefon..."
        />
        <FilterSelect
          value={filter}
          onChange={setFilter}
          options={FILTER_OPTIONS}
          allLabel="Toate statusurile"
        />
        <FilterReset onReset={resetFilters} visible={hasFilters} />
      </FilterBar>

      {hasFilters && (
        <p className="text-xs text-gray-500">
          {filtered.length} din {requests.length} cereri
        </p>
      )}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 py-4">Nicio cerere gasita</p>
          </Card>
        ) : (
          filtered.map((req) => (
            <Card key={req.id}>
              <button onClick={() => expand(req)} className="w-full text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-gray-900">{req.name}</span>
                      <Badge variant={statusVariants[req.status]}>{statusLabels[req.status]}</Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {req.email} {req.phone && `· ${req.phone}`} · {formatDate(req.created_at)}
                    </div>
                  </div>
                  {expandedId === req.id ? (
                    <ChevronUp size={18} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-400" />
                  )}
                </div>
              </button>

              {expandedId === req.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Descriere</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{req.description}</p>
                  </div>

                  {req.attachment_url && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                        Atasament
                      </p>
                      <button
                        onClick={() => downloadAttachment(req.id)}
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        <Download size={14} /> Descarca atasament
                      </button>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                        Status
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as PackageRequestStatus)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {statusLabels[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                        Note admin
                      </label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                        placeholder="Raspuns / note interne..."
                      />
                    </div>
                  </div>

                  <Button size="sm" onClick={() => handleSave(req.id)} loading={saving}>
                    Salveaza
                  </Button>

                  {/* Offer section divider */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-gray-900">Oferta</p>
                      {req.offer_status && (
                        <Badge
                          variant={
                            req.offer_status === 'pending'
                              ? 'warning'
                              : req.offer_status === 'accepted'
                                ? 'success'
                                : 'neutral'
                          }
                        >
                          {req.offer_status === 'pending'
                            ? 'In asteptare'
                            : req.offer_status === 'accepted'
                              ? 'Acceptata'
                              : req.offer_status === 'rejected'
                                ? 'Refuzata'
                                : 'Inchisa'}
                        </Badge>
                      )}
                    </div>

                    {/* No offer yet — show create button */}
                    {!req.offer_status && !showOfferForm && (
                      <Button size="sm" variant="primary" onClick={() => setShowOfferForm(true)}>
                        <Plus size={14} className="mr-1" /> Creeaza oferta
                      </Button>
                    )}

                    {/* Offer form (creating or editing pending) */}
                    {(showOfferForm ||
                      (req.offer_status === 'pending' && expandedId === req.id)) && (
                      <div className="space-y-4">
                        {/* Product search */}
                        <div className="relative">
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Search
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              />
                              <input
                                type="text"
                                value={productQuery}
                                onChange={(e) => searchProducts(e.target.value)}
                                placeholder="Cauta produs din catalog..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            <Button size="sm" variant="ghost" onClick={addCustomItem}>
                              <Plus size={14} className="mr-1" /> Produs custom
                            </Button>
                          </div>
                          {/* Search results dropdown */}
                          {productResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                              {productResults.map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => addCatalogProduct(p)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-primary/5 flex items-center justify-between"
                                >
                                  <span className="text-gray-900">{p.name}</span>
                                  <span className="text-gray-500 text-xs">
                                    {formatPrice(p.sale_price ?? p.price)} · stoc: {p.stock}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                          {searching && <p className="text-xs text-gray-400 mt-1">Se cauta...</p>}
                        </div>

                        {/* Offer items table */}
                        {offerItemsDraft.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">
                                    Produs
                                  </th>
                                  <th className="text-center py-2 text-xs font-semibold text-gray-500 uppercase w-20">
                                    Cant.
                                  </th>
                                  <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase w-28">
                                    Pret
                                  </th>
                                  <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase w-28">
                                    Subtotal
                                  </th>
                                  <th className="w-10"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {offerItemsDraft.map((item, idx) => (
                                  <tr key={idx} className="border-b border-gray-100">
                                    <td className="py-2">
                                      {item.productId ? (
                                        <span className="text-gray-900">{item.productName}</span>
                                      ) : (
                                        <input
                                          type="text"
                                          value={item.productName}
                                          onChange={(e) =>
                                            updateOfferItem(idx, 'productName', e.target.value)
                                          }
                                          placeholder="Nume produs custom"
                                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                      )}
                                    </td>
                                    <td className="py-2 text-center">
                                      <input
                                        type="number"
                                        min={1}
                                        value={item.quantity}
                                        onChange={(e) =>
                                          updateOfferItem(
                                            idx,
                                            'quantity',
                                            parseInt(e.target.value) || 1,
                                          )
                                        }
                                        className="w-16 text-center px-1 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                                      />
                                    </td>
                                    <td className="py-2 text-right">
                                      <input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        value={item.unitPrice}
                                        onChange={(e) =>
                                          updateOfferItem(
                                            idx,
                                            'unitPrice',
                                            parseFloat(e.target.value) || 0,
                                          )
                                        }
                                        className="w-24 text-right px-1 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                                      />
                                    </td>
                                    <td className="py-2 text-right font-medium text-gray-900">
                                      {formatPrice(item.unitPrice * item.quantity)}
                                    </td>
                                    <td className="py-2 text-center">
                                      <button
                                        onClick={() => removeOfferItem(idx)}
                                        className="text-red-400 hover:text-red-600"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className="flex justify-end pt-2 border-t border-gray-200 mt-2">
                              <span className="text-sm font-semibold text-gray-900">
                                Total:{' '}
                                {formatPrice(
                                  offerItemsDraft.reduce(
                                    (sum, i) => sum + i.unitPrice * i.quantity,
                                    0,
                                  ),
                                )}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Offer notes */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                            Mesaj catre client
                          </label>
                          <textarea
                            value={offerNotesDraft}
                            onChange={(e) => setOfferNotesDraft(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                            placeholder="Ex: Am inclus si manopera..."
                          />
                        </div>

                        {/* Send / Close buttons */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => sendOffer(req.id)}
                            loading={sendingOffer}
                          >
                            <Send size={14} className="mr-1" /> Trimite oferta
                          </Button>
                          {req.offer_status === 'pending' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => closeOffer(req.id)}
                              loading={closingOffer}
                            >
                              <XCircle size={14} className="mr-1" /> Inchide oferta
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Read-only view for accepted/rejected/closed */}
                    {(req.offer_status === 'accepted' ||
                      req.offer_status === 'rejected' ||
                      req.offer_status === 'closed') &&
                      req.package_offer_items?.length > 0 && (
                        <div className="space-y-2">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2 text-xs font-semibold text-gray-500">
                                  Produs
                                </th>
                                <th className="text-center py-2 text-xs font-semibold text-gray-500">
                                  Cant.
                                </th>
                                <th className="text-right py-2 text-xs font-semibold text-gray-500">
                                  Pret
                                </th>
                                <th className="text-right py-2 text-xs font-semibold text-gray-500">
                                  Subtotal
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {req.package_offer_items.map((item) => (
                                <tr key={item.id} className="border-b border-gray-100">
                                  <td className="py-2 text-gray-700">{item.product_name}</td>
                                  <td className="py-2 text-center text-gray-700">
                                    {item.quantity}
                                  </td>
                                  <td className="py-2 text-right text-gray-700">
                                    {formatPrice(item.unit_price)}
                                  </td>
                                  <td className="py-2 text-right font-medium">
                                    {formatPrice(item.unit_price * item.quantity)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {req.offer_total && (
                            <p className="text-right text-sm font-semibold">
                              Total: {formatPrice(req.offer_total)}
                            </p>
                          )}
                          {req.offer_notes && (
                            <p className="text-sm text-gray-500 italic">{req.offer_notes}</p>
                          )}
                        </div>
                      )}
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </AdminPageShell>
  );
}
