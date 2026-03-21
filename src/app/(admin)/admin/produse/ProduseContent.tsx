'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminPageShell } from '@/components/ui/AdminPageShell';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { getStorageUrl, formatPrice } from '@/lib/utils';
import { Pencil, Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import { FilterBar } from '@/components/ui/filters/FilterBar';
import { FilterSearch } from '@/components/ui/filters/FilterSearch';
import { FilterSelect } from '@/components/ui/filters/FilterSelect';
import { FilterReset } from '@/components/ui/filters/FilterReset';
import type { Product, Category } from '@/types/database';

interface Props {
  initialProducts: Product[];
  categories: Pick<Category, 'id' | 'name'>[];
}

export default function ProduseContent({ initialProducts, categories }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [discountFilter, setDiscountFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setProducts(data as Product[]);
  }

  async function deleteProductFiles(product: Product) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const headers = {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };

    // Best-effort: delete product images
    if (product.images.length > 0) {
      await fetch('/api/admin/upload', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ bucket: 'product-images', paths: product.images }),
      }).catch(() => {});
    }

    // Best-effort: delete datasheet
    if (product.datasheet_url) {
      await fetch('/api/admin/upload', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ bucket: 'datasheets', paths: [product.datasheet_url] }),
      }).catch(() => {});
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    // Best-effort Storage cleanup
    await deleteProductFiles(deleteTarget);

    const supabase = createClient();
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', deleteTarget.id);

    if (error) {
      toast(`Eroare la stergere: ${error.message}`, 'error');
    } else {
      toast('Produs sters', 'success');
      await refresh();
      router.refresh();
    }
    setDeleteTarget(null);
  }

  function getCategoryName(categoryId: string | null) {
    if (!categoryId) return '\u2014';
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.name || '\u2014';
  }

  const hasFilters = search !== '' || categoryFilter !== 'all' || activeFilter !== 'all' || stockFilter !== 'all' || discountFilter !== 'all';

  const filtered = products.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !(p.sku?.toLowerCase() || '').includes(q) && !p.brand_name.toLowerCase().includes(q)) return false;
    }
    if (categoryFilter !== 'all' && p.category_id !== categoryFilter) return false;
    if (activeFilter === 'active' && !p.is_active) return false;
    if (activeFilter === 'inactive' && p.is_active) return false;
    if (stockFilter === 'instock' && p.stock === 0) return false;
    if (stockFilter === 'nostock' && p.stock > 0) return false;
    if (discountFilter === 'discount' && (p.sale_price === null || p.sale_price >= p.price)) return false;
    if (discountFilter === 'nodiscount' && p.sale_price !== null && p.sale_price < p.price) return false;
    return true;
  });

  function resetFilters() {
    setSearch('');
    setCategoryFilter('all');
    setActiveFilter('all');
    setStockFilter('all');
    setDiscountFilter('all');
  }

  type Row = Record<string, unknown>;
  const p = (r: Row) => r as unknown as Product;
  const columns: { key: string; label: string; render?: (item: Row) => React.ReactNode }[] = [
    {
      key: 'image',
      label: '',
      render: (r) => { const prod = p(r); const thumb = prod.images[0]; return thumb ? (
          <img src={getStorageUrl('product-images', thumb)} alt="" className="w-10 h-10 rounded object-cover" />
        ) : (
          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
            <ImageIcon size={16} className="text-gray-400" />
          </div>
        );
      },
    },
    {
      key: 'name',
      label: 'Produs',
      render: (r) => { const prod = p(r); return (
        <div>
          <p className="font-medium">{prod.name}</p>
          {prod.brand_name && <p className="text-xs text-gray-500">{prod.brand_name}</p>}
        </div>
      ); },
    },
    { key: 'sku', label: 'SKU' },
    {
      key: 'price',
      label: 'Pret',
      render: (r) => { const prod = p(r); return (
        <div>
          {prod.sale_price !== null && prod.sale_price < prod.price ? (
            <>
              <p className="font-medium text-red-600">{formatPrice(prod.sale_price)}</p>
              <p className="text-xs text-gray-400 line-through">{formatPrice(prod.price)}</p>
            </>
          ) : (
            <p className="font-medium">{formatPrice(prod.price)}</p>
          )}
        </div>
      ); },
    },
    {
      key: 'stock',
      label: 'Stoc',
      render: (r) => { const prod = p(r); return (
        <span className={prod.stock === 0 ? 'text-red-600 font-medium' : ''}>
          {prod.stock}
        </span>
      ); },
    },
    {
      key: 'category_id',
      label: 'Categorie',
      render: (r) => getCategoryName(p(r).category_id),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (r) => { const prod = p(r); return (
        <div className="flex items-center gap-1.5">
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${prod.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {prod.is_active ? 'Activ' : 'Inactiv'}
          </span>
          {prod.is_featured && (
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              Recomandat
            </span>
          )}
        </div>
      ); },
    },
    {
      key: 'actions',
      label: '',
      render: (r) => { const prod = p(r); return (
        <div className="flex gap-1">
          <Link href={`/admin/produse/${prod.id}`} className="p-1.5 rounded-lg hover:bg-primary/5 text-gray-400 hover:text-primary transition-all" title="Editeaza">
            <Pencil size={16} />
          </Link>
          <button onClick={() => setDeleteTarget(prod)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600" title="Sterge">
            <Trash2 size={16} />
          </button>
        </div>
      ); },
    },
  ];

  return (
    <>
      <AdminPageShell
        title="Produse"
        description={`${products.length} produse in catalog`}
        action={
          <Link href="/admin/produse/nou">
            <Button size="sm">
              <Plus size={16} className="mr-1" /> Produs nou
            </Button>
          </Link>
        }
      >
        <FilterBar>
          <FilterSearch value={search} onChange={setSearch} placeholder="Cauta nume, SKU, brand..." />
          <FilterSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            allLabel="Toate categoriile"
          />
          <FilterSelect
            value={activeFilter}
            onChange={setActiveFilter}
            options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
            allLabel="Toate statusurile"
          />
          <FilterSelect
            value={stockFilter}
            onChange={setStockFilter}
            options={[{ value: 'instock', label: 'In stoc' }, { value: 'nostock', label: 'Stoc 0' }]}
            allLabel="Tot stocul"
          />
          <FilterSelect
            value={discountFilter}
            onChange={setDiscountFilter}
            options={[{ value: 'discount', label: 'Cu discount' }, { value: 'nodiscount', label: 'Fara discount' }]}
            allLabel="Toate preturile"
          />
          <FilterReset onReset={resetFilters} visible={hasFilters} />
        </FilterBar>

        <p className="text-xs text-gray-500">{filtered.length} din {products.length} produse</p>

        <Card>
          <DataTable
            columns={columns}
            data={filtered as unknown as Row[]}
            emptyMessage="Nu exista produse. Adauga primul produs."
          />
        </Card>
      </AdminPageShell>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Sterge produs"
        message={`Esti sigur ca vrei sa stergi "${deleteTarget?.name}"? Aceasta actiune nu poate fi anulata.`}
        confirmText="Sterge"
        variant="danger"
      />
    </>
  );
}
