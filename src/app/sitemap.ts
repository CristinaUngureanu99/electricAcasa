import type { MetadataRoute } from 'next';
import { getPublicSupabase } from '@/lib/supabase-server';
import { site } from '@/config/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = site.url;
  const supabase = getPublicSupabase();

  const [categoriesRes, productsRes] = await Promise.all([
    supabase
      .from('categories')
      .select('slug')
      .is('parent_id', null)
      .eq('is_active', true),
    supabase
      .from('products')
      .select('slug, updated_at')
      .eq('is_active', true),
  ]);

  const categories = (categoriesRes.data || []) as { slug: string }[];
  const products = (productsRes.data || []) as { slug: string; updated_at: string }[];

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/catalog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/generator-pachet`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/despre`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/politica-retur`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/cookies`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/categorie/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((prod) => ({
    url: `${baseUrl}/produs/${prod.slug}`,
    lastModified: new Date(prod.updated_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
