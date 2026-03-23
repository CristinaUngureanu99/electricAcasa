export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '\u2014';
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return '\u2014';
  return parsed.toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '\u2014';
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return '\u2014';
  return parsed.toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const diacriticsMap: Record<string, string> = {
  ă: 'a',
  â: 'a',
  î: 'i',
  ț: 't',
  ș: 's',
  Ă: 'a',
  Â: 'a',
  Î: 'i',
  Ț: 't',
  Ș: 's',
};

export function generateSlug(name: string): string {
  return name
    .replace(/[ăâîțșĂÂÎȚȘ]/g, (ch) => diacriticsMap[ch] || ch)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getStorageUrl(bucket: string, path: string | null | undefined): string {
  if (!path) return '';
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

export function formatPrice(price: number): string {
  return (
    price.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' RON'
  );
}
