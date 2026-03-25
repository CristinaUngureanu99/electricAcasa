'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getStorageUrl } from '@/lib/utils';
import { Image as ImageIcon } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center">
        <ImageIcon size={64} className="text-gray-300" />
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-square relative bg-gray-50 rounded-2xl overflow-hidden mb-3">
        <Image
          key={selected}
          src={getStorageUrl('product-images', images[selected])}
          alt={productName}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          quality={85}
          priority={selected === 0}
          className="object-cover animate-[fadeIn_0.2s_ease-out]"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {images.map((path, i) => (
            <button
              key={path}
              onClick={() => setSelected(i)}
              aria-label={`Imagine ${i + 1} din ${images.length}`}
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                i === selected ? 'border-primary' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <Image
                src={getStorageUrl('product-images', path)}
                alt={`${productName} ${i + 1}`}
                width={64}
                height={64}
                quality={60}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
