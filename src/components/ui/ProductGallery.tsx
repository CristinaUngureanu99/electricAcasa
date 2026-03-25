'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getStorageUrl } from '@/lib/utils';
import { Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') setSelected((s) => Math.min(s + 1, images.length - 1));
      if (e.key === 'ArrowLeft') setSelected((s) => Math.max(s - 1, 0));
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [lightbox, images.length]);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center">
        <ImageIcon size={64} className="text-gray-300" />
      </div>
    );
  }

  return (
    <div>
      <div
        className="aspect-square relative bg-gray-50 rounded-2xl overflow-hidden mb-3 cursor-zoom-in"
        onClick={() => setLightbox(true)}
      >
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

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
            aria-label="Inchide"
          >
            <X size={28} />
          </button>

          {images.length > 1 && selected > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelected(selected - 1);
              }}
              className="absolute left-4 p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Imaginea anterioara"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          {images.length > 1 && selected < images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelected(selected + 1);
              }}
              className="absolute right-4 p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Imaginea urmatoare"
            >
              <ChevronRight size={32} />
            </button>
          )}

          <div
            className="relative w-full max-w-4xl max-h-[85vh] aspect-square mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={getStorageUrl('product-images', images[selected])}
              alt={productName}
              fill
              sizes="100vw"
              quality={90}
              className="object-contain"
            />
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-4 text-white/60 text-sm">
              {selected + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
