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
import type { Product, Category } from '@/types/database';

interface Props {
  initialProducts: Product[];
  categories: Pick<Category, 'id' | 'name'>[];
}

export default function ProduseContent({ initialProducts, categories }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
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

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku?.toLowerCase() || '').includes(q) ||
      p.brand_name.toLowerCase().includes(q)
    );
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: any[] = [
    {
      key: 'image',
      label: '',
      render: (p: Product) => {
        const thumb = p.images[0];
        return thumb ? (
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
      render: (p: Product) => (
        <div>
          <p className="font-medium">{p.name}</p>
          {p.brand_name && <p className="text-xs text-gray-500">{p.brand_name}</p>}
        </div>
      ),
    },
    { key: 'sku', label: 'SKU' },
    {
      key: 'price',
      label: 'Pret',
      render: (p: Product) => (
        <div>
          {p.sale_price !== null && p.sale_price < p.price ? (
            <>
              <p className="font-medium text-red-600">{formatPrice(p.sale_price)}</p>
              <p className="text-xs text-gray-400 line-through">{formatPrice(p.price)}</p>
            </>
          ) : (
            <p className="font-medium">{formatPrice(p.price)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      label: 'Stoc',
      render: (p: Product) => (
        <span className={p.stock === 0 ? 'text-red-600 font-medium' : ''}>
          {p.stock}
        </span>
      ),
    },
    {
      key: 'category_id',
      label: 'Categorie',
      render: (p: Product) => getCategoryName(p.category_id),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (p: Product) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {p.is_active ? 'Activ' : 'Inactiv'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (p: Product) => (
        <div className="flex gap-1">
          <Link href={`/admin/produse/${p.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700" title="Editeaza">
            <Pencil size={16} />
          </Link>
          <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600" title="Sterge">
            <Trash2 size={16} />
          </button>
        </div>
      ),
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
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Cauta dupa nume, SKU sau brand...',
        }}
      >
        <Card>
          <DataTable
            columns={columns}
            data={filtered as any}
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
