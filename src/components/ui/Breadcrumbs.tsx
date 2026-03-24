import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { site } from '@/config/site';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const jsonLdItems = items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.label,
    ...(item.href ? { item: `${site.url}${item.href}` } : {}),
  }));

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: jsonLdItems,
        }}
      />
      <nav
        aria-label="Breadcrumbs"
        className="flex items-center gap-1.5 text-sm text-gray-500 mb-6"
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={14} className="text-gray-400" />}
              {isLast || !item.href ? (
                <span className="text-gray-900 font-semibold line-clamp-1">{item.label}</span>
              ) : (
                <Link
                  href={item.href}
                  className="text-primary/80 hover:text-primary hover:underline underline-offset-2"
                >
                  {item.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>
    </>
  );
}
