'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { AdminPageShell } from '@/components/ui/AdminPageShell';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { generateSlug, getStorageUrl } from '@/lib/utils';
import { Pencil, Trash2, Plus, X, Image as ImageIcon } from 'lucide-react';
import type { Category } from '@/types/database';

interface Props {
  initialCategories: Category[];
}

interface CategoryForm {
  id: string;
  name: string;
  slug: string;
  parent_id: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm = (): CategoryForm => ({
  id: crypto.randomUUID(),
  name: '',
  slug: '',
  parent_id: '',
  image_url: '',
  sort_order: 0,
  is_active: true,
});

export default function CategoriiContent({ initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [form, setForm] = useState<CategoryForm | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pendingImageDelete, setPendingImageDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (data) setCategories(data as Category[]);
  }

  function startCreate() {
    setForm(emptyForm());
    setEditing(false);
    setImageFile(null);
    setPendingImageDelete(null);
  }

  function startEdit(cat: Category) {
    setForm({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      parent_id: cat.parent_id || '',
      image_url: cat.image_url || '',
      sort_order: cat.sort_order,
      is_active: cat.is_active,
    });
    setEditing(true);
    setImageFile(null);
    setPendingImageDelete(null);
  }

  function cancelForm() {
    setForm(null);
    setImageFile(null);
    setPendingImageDelete(null);
  }

  async function uploadImage(categoryId: string, file: File): Promise<string | null> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `categories/${categoryId}/cover-${Date.now()}.${ext}`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'product-images');
    formData.append('path', path);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.access_token}` },
      body: formData,
    });

    if (!res.ok) return null;
    const { path: storagePath } = await res.json();
    return storagePath;
  }

  async function deleteStorageFile(path: string) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await fetch('/api/admin/upload', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bucket: 'product-images', paths: [path] }),
    });
  }

  async function handleSave() {
    if (!form) return;
    if (!form.name.trim()) {
      toast('Numele categoriei este obligatoriu', 'error');
      return;
    }

    setSaving(true);
    let newlyUploadedPath: string | null = null;

    try {
      const supabase = createClient();
      let imagePath = form.image_url;

      // Determine which old image(s) to delete after successful save:
      // - pendingImageDelete: user explicitly clicked "Sterge"
      // - direct replacement: user picked new file without clicking "Sterge" first
      const originalImage = editing
        ? categories.find((c) => c.id === form.id)?.image_url || null
        : null;

      const oldImageToDelete = pendingImageDelete
        || (imageFile && originalImage ? originalImage : null);

      // If image was explicitly removed without replacement, clear path
      if (pendingImageDelete && !imageFile) {
        imagePath = '';
      }

      // Step 1: Upload new image if provided (need path for DB record)
      if (imageFile) {
        const uploaded = await uploadImage(form.id, imageFile);
        if (uploaded) {
          newlyUploadedPath = uploaded;
          imagePath = uploaded;
        } else {
          toast('Eroare la upload imagine', 'error');
          setSaving(false);
          return;
        }
      }

      const slug = form.slug.trim() || generateSlug(form.name);

      const record = {
        name: form.name.trim(),
        slug,
        parent_id: form.parent_id || null,
        image_url: imagePath || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };

      // Step 2: Save to DB
      let dbError: string | null = null;

      if (editing) {
        const { error } = await supabase
          .from('categories')
          .update(record)
          .eq('id', form.id);
        if (error) dbError = error.message;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({ id: form.id, ...record });
        if (error) dbError = error.message;
      }

      if (dbError) {
        // Step 2b: DB failed — rollback newly uploaded image
        if (newlyUploadedPath) {
          await deleteStorageFile(newlyUploadedPath);
        }
        toast(`Eroare: ${dbError}`, 'error');
        setSaving(false);
        return;
      }

      // Step 3: DB succeeded — delete old image that was replaced
      if (oldImageToDelete && oldImageToDelete !== imagePath) {
        await deleteStorageFile(oldImageToDelete);
      }

      toast(editing ? 'Categorie actualizata' : 'Categorie creata', 'success');
      setForm(null);
      setImageFile(null);
      await refresh();
      router.refresh();
    } catch {
      // Rollback new upload on unexpected error
      if (newlyUploadedPath) {
        await deleteStorageFile(newlyUploadedPath);
      }
      toast('Eroare neasteptata', 'error');
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    // Best-effort cleanup: delete image from Storage
    if (deleteTarget.image_url) {
      await deleteStorageFile(deleteTarget.image_url);
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', deleteTarget.id);

    if (error) {
      toast(`Eroare la stergere: ${error.message}`, 'error');
    } else {
      toast('Categorie stearsa', 'success');
      await refresh();
      router.refresh();
    }
    setDeleteTarget(null);
  }

  function getParentName(parentId: string | null) {
    if (!parentId) return '\u2014';
    const parent = categories.find((c) => c.id === parentId);
    return parent?.name || '\u2014';
  }

  type Row = Record<string, unknown>;
  const c = (r: Row) => r as unknown as Category;
  const columns: { key: string; label: string; render?: (item: Row) => React.ReactNode }[] = [
    {
      key: 'name',
      label: 'Nume',
      render: (r) => { const cat = c(r); return (
        <div className="flex items-center gap-2">
          {cat.image_url ? (
            <img
              src={getStorageUrl('product-images', cat.image_url)}
              alt=""
              className="w-8 h-8 rounded object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
              <ImageIcon size={14} className="text-gray-400" />
            </div>
          )}
          <span className="font-medium">{cat.name}</span>
        </div>
      ); },
    },
    { key: 'slug', label: 'Slug' },
    {
      key: 'parent_id',
      label: 'Categorie parinte',
      render: (r) => getParentName(c(r).parent_id),
    },
    { key: 'sort_order', label: 'Ordine' },
    {
      key: 'is_active',
      label: 'Status',
      render: (r) => { const cat = c(r); return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cat.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {cat.is_active ? 'Activ' : 'Inactiv'}
        </span>
      ); },
    },
    {
      key: 'actions',
      label: '',
      render: (r) => { const cat = c(r); return (
        <div className="flex gap-1">
          <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700" title="Editeaza">
            <Pencil size={16} />
          </button>
          <button onClick={() => setDeleteTarget(cat)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600" title="Sterge">
            <Trash2 size={16} />
          </button>
        </div>
      ); },
    },
  ];

  return (
    <>
      <AdminPageShell
        title="Categorii"
        description="Gestioneaza categoriile de produse"
        action={
          !form && (
            <Button onClick={startCreate} size="sm">
              <Plus size={16} className="mr-1" /> Categorie noua
            </Button>
          )
        }
      >
        {form && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? 'Editeaza categorie' : 'Categorie noua'}
              </h2>
              <button onClick={cancelForm} className="p-1 rounded hover:bg-gray-100">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nume *"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => f ? { ...f, name, slug: editing ? f.slug : generateSlug(name) } : f);
                }}
                placeholder="ex: Aparataj Electric"
              />
              <Input
                label="Slug"
                value={form.slug}
                onChange={(e) => setForm((f) => f ? { ...f, slug: e.target.value } : f)}
                placeholder="auto-generat din nume"
              />
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Categorie parinte</label>
                <select
                  value={form.parent_id}
                  onChange={(e) => setForm((f) => f ? { ...f, parent_id: e.target.value } : f)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Niciuna (categorie principala)</option>
                  {categories
                    .filter((c) => c.id !== form.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>
              <Input
                label="Ordine sortare"
                type="number"
                value={String(form.sort_order)}
                onChange={(e) => setForm((f) => f ? { ...f, sort_order: parseInt(e.target.value) || 0 } : f)}
              />
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagine</label>
                {form.image_url && !imageFile && (
                  <div className="mb-2 flex items-center gap-2">
                    <img src={getStorageUrl('product-images', form.image_url)} alt="" className="w-16 h-16 rounded object-cover" />
                    <button
                      onClick={() => {
                        setPendingImageDelete(form.image_url);
                        setForm((f) => f ? { ...f, image_url: '' } : f);
                      }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Sterge
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="cat-active"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => f ? { ...f, is_active: e.target.checked } : f)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="cat-active" className="text-sm text-gray-700">Activ</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave} loading={saving}>
                {editing ? 'Salveaza' : 'Creeaza'}
              </Button>
              <Button variant="ghost" onClick={cancelForm}>Anuleaza</Button>
            </div>
          </Card>
        )}

        <Card>
          <DataTable
            columns={columns}
            data={categories as unknown as Row[]}
            emptyMessage="Nu exista categorii. Creeaza prima categorie."
          />
        </Card>
      </AdminPageShell>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Sterge categorie"
        message={`Esti sigur ca vrei sa stergi categoria "${deleteTarget?.name}"? Produsele asociate vor ramane fara categorie.`}
        confirmText="Sterge"
        variant="danger"
      />
    </>
  );
}
