'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { ShoppingCart, Minus, Plus } from 'lucide-react';

interface AddToCartButtonProps {
  productId: string;
  stock: number;
  productName: string;
}

export function AddToCartButton({ productId, stock, productName }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const { addItem } = useCart();
  const { toast } = useToast();

  if (stock <= 0) {
    return (
      <Button size="lg" disabled className="w-full sm:w-auto">
        <ShoppingCart size={18} className="mr-2" />
        Indisponibil
      </Button>
    );
  }

  async function handleAdd() {
    setAdding(true);
    const success = await addItem(productId, quantity);
    if (success) {
      toast(`${productName} adaugat in cos`, 'success');
      setQuantity(1);
    } else {
      toast('Eroare la adaugarea in cos', 'error');
    }
    setAdding(false);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="px-3 py-2.5 text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Scade cantitatea"
        >
          <Minus size={16} />
        </button>
        <span className="px-4 py-2.5 text-sm font-medium min-w-[3rem] text-center">{quantity}</span>
        <button
          onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
          className="px-3 py-2.5 text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Creste cantitatea"
        >
          <Plus size={16} />
        </button>
      </div>
      <Button size="lg" onClick={handleAdd} loading={adding} className="flex-1 sm:flex-none">
        <ShoppingCart size={18} className="mr-2" />
        Adauga in cos
      </Button>
    </div>
  );
}
