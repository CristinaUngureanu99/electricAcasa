'use client';

import { useEffect } from 'react';
import { trackProductView } from '@/components/ui/RecentlyViewed';

export function TrackView({ slug }: { slug: string }) {
  useEffect(() => {
    trackProductView(slug);
  }, [slug]);

  return null;
}
