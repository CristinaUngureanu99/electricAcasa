'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase';
import { AdminPageShell } from '@/components/ui/AdminPageShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { generateSlug, getStorageUrl } from '@/lib/utils';
import { Trash2, Plus, Upload, FileText, X, Link2 } from 'lucide-react';
import type { Product, Category, ProductRelation, ProductSpec } from '@/types/database';

interface Props {
  initialProduct?: Product;
  categories: Pick<Category, 'id' | 'name' | 'is_active'>[];
  initialRelations?: ProductRelation[];
  allProducts?: Pick<Product, 'id' | 'name'>[];
}

export default function ProductForm({ initialProduct, categories, initialRelations = [], allProducts = [] }: Props) {
  const isEditing = !!initialProduct;
  const productId = useMemo(() => initialProduct?.id || crypto.randomUUID(), [initialProduct]);

  const [name, setName] = useState(initialProduct?.name || '');
  const [slug, setSlug] = useState(initialProduct?.slug || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [sku, setSku] = useState(initialProduct?.sku || '');
  const [brandName, setBrandName] = useState(initialProduct?.brand_name || '');
  const [price, setPrice] = useState(initialProduct?.price?.toString() || '');
  const [salePrice, setSalePrice] = useState(initialProduct?.sale_price?.toString() || '');
  const [categoryId, setCategoryId] = useState(initialProduct?.category_id || '');
  const [stock, setStock] = useState(initialProduct?.stock?.toString() || '0');
  const [isActive, setIsActive] = useState(initialProduct?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(initialProduct?.is_featured ?? false);

  const [images, setImages] = useState<string[]>(initialProduct?.images || []);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [pendingImageDeletes, setPendingImageDeletes] = useState<string[]>([]);
  const [datasheetPath, setDatasheetPath] = useState(initialProduct?.datasheet_url || '');
  const [pendingDatasheetDelete, setPendingDatasheetDelete] = useState<string | null>(null);
  const [newDatasheet, setNewDatasheet] = useState<File | null>(null);

  const [specs, setSpecs] = useState<ProductSpec[]>(initialProduct?.specs || []);
  const [relations, setRelations] = useState<ProductRelation[]>(initialRelations);
  const [newRelationId, setNewRelationId] = useState('');

  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function getSession() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  async function uploadFile(file: File, bucket: string, path: string): Promise<string | null> {
    const session = await getSession();
    if (!session) return null;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    formData.append('path', path);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.access_token}` },
      body: formData,
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.path;
  }

  async function deleteFiles(bucket: string, paths: string[]) {
    if (paths.length === 0) return;
    const session = await getSession();
    if (!session) return;

    await fetch('/api/admin/upload', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bucket, paths }),
    }).catch(() => {});
  }

  async function handleSave() {
    if (!name.trim()) { toast('Numele produsului este obligatoriu', 'error'); return; }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) { toast('Pretul trebuie sa fie un numar pozitiv', 'error'); return; }

    const salePriceNum = salePrice ? parseFloat(salePrice) : null;
    if (salePriceNum !== null && (isNaN(salePriceNum) || salePriceNum < 0)) {
      toast('Pretul redus trebuie sa fie un numar pozitiv', 'error'); return;
    }
    if (salePriceNum !== null && salePriceNum > priceNum) {
      toast('Pretul redus nu poate fi mai mare decat pretul', 'error'); return;
    }

    const stockNum = parseInt(stock);
    if (isNaN(stockNum) || stockNum < 0) { toast('Stocul trebuie sa fie un numar pozitiv', 'error'); return; }

    setSaving(true);
    const newlyUploadedPaths: { bucket: string; path: string }[] = [];

    try {
      // Step 1: Upload new images (need paths for DB record)
      const uploadedImages = [...images];
      for (let i = 0; i < newImageFiles.length; i++) {
        const file = newImageFiles[i];
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `products/${productId}/img-${Date.now()}-${i}.${ext}`;
        const uploaded = await uploadFile(file, 'product-images', path);
        if (uploaded) {
          uploadedImages.push(uploaded);
          newlyUploadedPaths.push({ bucket: 'product-images', path: uploaded });
        } else {
          toast(`Eroare la upload imagine: ${file.name}`, 'error');
        }
      }

      // Step 1b: Upload new datasheet if provided
      let finalDatasheet = datasheetPath;
      // Old datasheet to delete: either explicitly removed, or being replaced
      const oldDatasheetToDelete = pendingDatasheetDelete
        || (newDatasheet && initialProduct?.datasheet_url ? initialProduct.datasheet_url : null);
      if (newDatasheet) {
        const ext = newDatasheet.name.split('.').pop() || 'pdf';
        const path = `products/${productId}/fisa-tehnica-${Date.now()}.${ext}`;
        const uploaded = await uploadFile(newDatasheet, 'datasheets', path);
        if (uploaded) {
          finalDatasheet = uploaded;
          newlyUploadedPaths.push({ bucket: 'datasheets', path: uploaded });
        } else {
          toast('Eroare la upload fisa tehnica', 'error');
        }
      }
      // If datasheet was removed without replacement
      if (!newDatasheet && pendingDatasheetDelete) {
        finalDatasheet = '';
      }

      const finalSlug = slug.trim() || generateSlug(name);

      const record = {
        name: name.trim(),
        slug: finalSlug,
        description: description.trim(),
        sku: sku.trim() || null,
        brand_name: brandName.trim(),
        price: priceNum,
        sale_price: salePriceNum,
        category_id: categoryId || null,
        stock: stockNum,
        is_active: isActive,
        is_featured: isFeatured,
        images: uploadedImages,
        specs,
        datasheet_url: finalDatasheet || null,
      };

      // Step 2: Save to DB
      const supabase = createClient();
      let dbError: string | null = null;

      if (isEditing) {
        const { error } = await supabase.from('products').update(record).eq('id', productId);
        if (error) dbError = error.message;
      } else {
        const { error } = await supabase.from('products').insert({ id: productId, ...record });
        if (error) dbError = error.message;
      }

      if (dbError) {
        // Step 2b: DB failed — rollback newly uploaded files
        for (const item of newlyUploadedPaths) {
          await deleteFiles(item.bucket, [item.path]);
        }
        toast(`Eroare: ${dbError}`, 'error');
        setSaving(false);
        return;
      }

      // Step 3: DB succeeded — delete old files that were replaced/removed (best-effort)
      if (pendingImageDeletes.length > 0) {
        await deleteFiles('product-images', pendingImageDeletes);
      }
      if (oldDatasheetToDelete) {
        await deleteFiles('datasheets', [oldDatasheetToDelete]);
      }

      toast(isEditing ? 'Produs actualizat' : 'Produs creat', 'success');
      router.push('/admin/produse');
      router.refresh();
    } catch {
      // Rollback new uploads on unexpected error
      for (const item of newlyUploadedPaths) {
        await deleteFiles(item.bucket, [item.path]);
      }
      toast('Eroare neasteptata', 'error');
    }
    setSaving(false);
  }

  function removeImage(index: number) {
    const path = images[index];
    setPendingImageDeletes((prev) => [...prev, path]);
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function removeDatasheet() {
    if (datasheetPath) {
      setPendingDatasheetDelete(datasheetPath);
    }
    setDatasheetPath('');
    setNewDatasheet(null);
  }

  function addSpec() {
    setSpecs((prev) => [...prev, { key: '', value: '' }]);
  }

  function updateSpec(index: number, field: 'key' | 'value', val: string) {
    setSpecs((prev) => prev.map((s, i) => i === index ? { ...s, [field]: val } : s));
  }

  function removeSpec(index: number) {
    setSpecs((prev) => prev.filter((_, i) => i !== index));
  }

  async function addRelation() {
    if (!newRelationId || !isEditing) return;
    const supabase = createClient();
    const { error } = await supabase.from('product_relations').insert({
      product_id: productId,
      related_product_id: newRelationId,
      type: 'compatible',
    });
    if (error) { toast(`Eroare: ${error.message}`, 'error'); return; }
    setRelations((prev) => [...prev, { product_id: productId, related_product_id: newRelationId, type: 'compatible' }]);
    setNewRelationId('');
    toast('Relatie adaugata', 'success');
  }

  async function removeRelation(relatedId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('product_relations')
      .delete()
      .eq('product_id', productId)
      .eq('related_product_id', relatedId);
    if (error) { toast(`Eroare: ${error.message}`, 'error'); return; }
    setRelations((prev) => prev.filter((r) => r.related_product_id !== relatedId));
    toast('Relatie stearsa', 'success');
  }

  const relatedIds = new Set(relations.map((r) => r.related_product_id));
  const availableProducts = allProducts.filter((p) => !relatedIds.has(p.id));

  return (
    <AdminPageShell
      title={isEditing ? 'Editeaza produs' : 'Produs nou'}
      description={isEditing ? initialProduct?.name : undefined}
    >
      {/* Basic info */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informatii generale</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nume produs *"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!isEditing) setSlug(generateSlug(e.target.value));
            }}
            placeholder="ex: Priza dubla cu USB"
          />
          <Input
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto-generat din nume"
          />
          <Input label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="ex: PRZ-USB-001" />
          <Input label="Brand" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="ex: Schneider" />
          <Input label="Pret (RON) *" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
          <Input label="Pret redus (RON)" type="number" step="0.01" min="0" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="optional" />
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Fara categorie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{!c.is_active ? ' (inactiv)' : ''}
                </option>
              ))}
            </select>
          </div>
          <Input label="Stoc *" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
          <div className="w-full col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
              placeholder="Descriere produs..."
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="prod-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="prod-active" className="text-sm text-gray-700">Produs activ</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="prod-featured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
              />
              <label htmlFor="prod-featured" className="text-sm text-gray-700">Recomandat pe homepage</label>
            </div>
          </div>
        </div>
      </Card>

      {/* Images */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Imagini</h2>
        {images.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            {images.map((path, i) => (
              <div key={path} className="relative group">
                <Image src={getStorageUrl('product-images', path)} alt="" width={96} height={96} className="rounded-lg object-cover" />
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">Principal</span>
                )}
                <button
                  onClick={() => removeImage(i)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        {newImageFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {newImageFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-1 bg-blue-50 rounded-lg px-2 py-1 text-xs text-blue-700">
                <Upload size={12} /> {f.name}
                <button onClick={() => setNewImageFiles((prev) => prev.filter((_, j) => j !== i))}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) setNewImageFiles((prev) => [...prev, ...files]);
            e.target.value = '';
          }}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
        />
        <p className="text-xs text-gray-400 mt-1">Prima imagine devine thumbnail. Max 5MB per imagine.</p>
      </Card>

      {/* Datasheet */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Fisa tehnica</h2>
        {datasheetPath && !newDatasheet && (
          <div className="flex items-center gap-3 mb-3">
            <FileText size={20} className="text-red-500" />
            <a
              href={getStorageUrl('datasheets', datasheetPath)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Descarca PDF
            </a>
            <button onClick={removeDatasheet} className="text-xs text-red-500 hover:underline">Sterge</button>
          </div>
        )}
        {newDatasheet && (
          <div className="flex items-center gap-2 mb-3 bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-700">
            <Upload size={14} /> {newDatasheet.name}
            <button onClick={() => setNewDatasheet(null)}><X size={14} /></button>
          </div>
        )}
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setNewDatasheet(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
        />
        <p className="text-xs text-gray-400 mt-1">PDF, max 10MB.</p>
      </Card>

      {/* Specs */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Specificatii</h2>
          <Button variant="ghost" size="sm" onClick={addSpec}>
            <Plus size={14} className="mr-1" /> Adauga
          </Button>
        </div>
        {specs.length === 0 ? (
          <p className="text-sm text-gray-400">Nicio specificatie adaugata.</p>
        ) : (
          <div className="space-y-2">
            {specs.map((spec, i) => (
              <div key={i} className="flex gap-2 items-start">
                <Input
                  placeholder="Proprietate (ex: Culoare)"
                  value={spec.key}
                  onChange={(e) => updateSpec(i, 'key', e.target.value)}
                />
                <Input
                  placeholder="Valoare (ex: Alb)"
                  value={spec.value}
                  onChange={(e) => updateSpec(i, 'value', e.target.value)}
                />
                <button onClick={() => removeSpec(i)} className="p-2.5 text-gray-400 hover:text-red-500 shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Relations (edit mode only) */}
      {isEditing && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Produse compatibile</h2>
          {relations.length > 0 && (
            <div className="space-y-2 mb-4">
              {relations.map((rel) => {
                const related = allProducts.find((p) => p.id === rel.related_product_id);
                return (
                  <div key={rel.related_product_id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Link2 size={14} className="text-gray-400" />
                      {related?.name || rel.related_product_id}
                    </div>
                    <button onClick={() => removeRelation(rel.related_product_id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {availableProducts.length > 0 && (
            <div className="flex gap-2">
              <select
                value={newRelationId}
                onChange={(e) => setNewRelationId(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Selecteaza produs...</option>
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <Button variant="secondary" size="sm" onClick={addRelation} disabled={!newRelationId}>
                <Plus size={14} className="mr-1" /> Adauga
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Save */}
      <div className="flex gap-3">
        <Button onClick={handleSave} loading={saving} size="lg">
          {isEditing ? 'Salveaza modificarile' : 'Creeaza produs'}
        </Button>
        <Button variant="ghost" size="lg" onClick={() => router.push('/admin/produse')}>
          Anuleaza
        </Button>
      </div>
    </AdminPageShell>
  );
}
