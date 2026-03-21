'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { site } from '@/config/site';
import type { Product } from '@/types/database';

const STORAGE_KEY = 'ea-cart';

interface LocalCartItem {
  productId: string;
  quantity: number;
}

export interface CartItemWithProduct {
  productId: string;
  quantity: number;
  product: Product;
}

interface CartContextValue {
  cartItems: CartItemWithProduct[];
  cartCount: number;
  subtotal: number;
  shippingCost: number;
  total: number;
  loading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>;
  removeItem: (productId: string) => Promise<boolean>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

function readLocalCart(): LocalCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalCart(items: LocalCartItem[]) {
  if (typeof window === 'undefined') return;
  if (items.length === 0) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<LocalCartItem[]>([]);
  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isMergingRef = useRef(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  const fetchProducts = useCallback(async (ids: string[]): Promise<Map<string, Product>> => {
    if (ids.length === 0) return new Map();
    const supabase = createClient();
    const { data } = await supabase
      .from('products')
      .select('*')
      .in('id', ids)
      .eq('is_active', true);
    const map = new Map<string, Product>();
    if (data) {
      for (const p of data as Product[]) {
        map.set(p.id, p);
      }
    }
    return map;
  }, []);

  const clampAndClean = useCallback(async (
    rawItems: LocalCartItem[],
    productMap: Map<string, Product>,
    isAuth: boolean,
    uid: string | null,
  ): Promise<LocalCartItem[]> => {
    const cleaned: LocalCartItem[] = [];
    const supabase = createClient();

    for (const item of rawItems) {
      const prod = productMap.get(item.productId);
      if (!prod || prod.stock <= 0) {
        if (isAuth && uid) {
          const { error } = await supabase.from('cart_items').delete().eq('user_id', uid).eq('product_id', item.productId);
          if (error) {
            // DB delete failed — keep item in local state so UI matches DB
            cleaned.push(item);
            continue;
          }
        }
        // Guest or DB delete succeeded — drop item
        continue;
      }
      const clampedQty = Math.min(item.quantity, prod.stock);
      if (clampedQty !== item.quantity && isAuth && uid) {
        const { error } = await supabase.from('cart_items').update({ quantity: clampedQty }).eq('user_id', uid).eq('product_id', item.productId);
        if (error) {
          // DB update failed — keep original quantity so UI matches DB
          cleaned.push(item);
          continue;
        }
      }
      cleaned.push({ productId: item.productId, quantity: clampedQty });
    }

    if (!isAuth) {
      writeLocalCart(cleaned);
    }

    return cleaned;
  }, []);

  // Merge guest cart into DB — incremental, retry-safe, checks { error }
  const mergeGuestCart = useCallback(async (uid: string) => {
    if (isMergingRef.current) return;
    isMergingRef.current = true;

    try {
      let guestItems = readLocalCart();
      if (guestItems.length === 0) return;

      const supabase = createClient();

      for (const item of [...guestItems]) {
        try {
          const { data: existing } = await supabase
            .from('cart_items')
            .select('quantity')
            .eq('user_id', uid)
            .eq('product_id', item.productId)
            .single();

          let writeError = false;

          if (existing) {
            const { error } = await supabase
              .from('cart_items')
              .update({ quantity: existing.quantity + item.quantity })
              .eq('user_id', uid)
              .eq('product_id', item.productId);
            if (error) writeError = true;
          } else {
            const { error } = await supabase
              .from('cart_items')
              .insert({ user_id: uid, product_id: item.productId, quantity: item.quantity });
            if (error) writeError = true;
          }

          if (!writeError) {
            // Only remove from localStorage after confirmed DB write
            guestItems = guestItems.filter((g) => g.productId !== item.productId);
            writeLocalCart(guestItems);
          }
          // If writeError, item stays in localStorage for retry
        } catch {
          // Network error etc — item stays in localStorage for retry
        }
      }
    } finally {
      isMergingRef.current = false;
    }
  }, []);

  const loadCart = useCallback(async (uid: string | null) => {
    try {
      let rawItems: LocalCartItem[];

      if (uid) {
        const guestItems = readLocalCart();
        if (guestItems.length > 0) {
          await mergeGuestCart(uid);
        }

        const supabase = createClient();
        const { data } = await supabase
          .from('cart_items')
          .select('product_id, quantity')
          .eq('user_id', uid);
        rawItems = (data || []).map((r: { product_id: string; quantity: number }) => ({
          productId: r.product_id,
          quantity: r.quantity,
        }));
      } else {
        rawItems = readLocalCart();
      }

      const ids = rawItems.map((i) => i.productId);
      const productMap = await fetchProducts(ids);
      const cleanedItems = await clampAndClean(rawItems, productMap, !!uid, uid);

      setProducts(productMap);
      setItems(cleanedItems);
    } catch (err) {
      console.error('[Cart] loadCart error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchProducts, clampAndClean, mergeGuestCart]);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string } | null } }) => {
      const uid = user?.id || null;
      setUserId(uid);
      void loadCart(uid);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: { user?: { id: string } } | null) => {
      const newUid = session?.user?.id || null;
      setUserId(newUid);
      if (event === 'SIGNED_IN' && newUid) {
        setLoading(true);
        setTimeout(() => { void loadCart(newUid); }, 0);
      } else if (event === 'SIGNED_OUT') {
        setItems([]);
        setProducts(new Map());
        setLoading(false);
      }
    });

    subscriptionRef.current = subscription;

    return () => {
      subscription.unsubscribe();
    };
  }, [loadCart]);

  // Add item — returns false on DB failure
  const addItem = useCallback(async (productId: string, quantity = 1): Promise<boolean> => {
    const existing = items.find((i) => i.productId === productId);

    let prod = products.get(productId);
    if (!prod) {
      const fetched = await fetchProducts([productId]);
      prod = fetched.get(productId);
      if (prod) {
        setProducts((prev) => new Map(prev).set(productId, prod!));
      }
    }
    if (!prod || prod.stock <= 0) return false;

    const currentQty = existing ? existing.quantity : 0;
    const newQty = Math.min(currentQty + quantity, prod.stock);

    if (userId) {
      const supabase = createClient();
      if (existing) {
        const { error } = await supabase.from('cart_items').update({ quantity: newQty }).eq('user_id', userId).eq('product_id', productId);
        if (error) return false;
      } else {
        const { error } = await supabase.from('cart_items').insert({ user_id: userId, product_id: productId, quantity: newQty });
        if (error) return false;
      }
    }

    const newItems = existing
      ? items.map((i) => i.productId === productId ? { ...i, quantity: newQty } : i)
      : [...items, { productId, quantity: newQty }];

    setItems(newItems);
    if (!userId) writeLocalCart(newItems);
    return true;
  }, [items, userId, products, fetchProducts]);

  // Update quantity — returns false on DB failure
  const updateQuantity = useCallback(async (productId: string, quantity: number): Promise<boolean> => {
    const prod = products.get(productId);
    if (!prod) return false;
    const clampedQty = Math.max(1, Math.min(quantity, prod.stock));

    if (userId) {
      const supabase = createClient();
      const { error } = await supabase.from('cart_items').update({ quantity: clampedQty }).eq('user_id', userId).eq('product_id', productId);
      if (error) return false;
    }

    const newItems = items.map((i) => i.productId === productId ? { ...i, quantity: clampedQty } : i);
    setItems(newItems);
    if (!userId) writeLocalCart(newItems);
    return true;
  }, [items, userId, products]);

  // Remove item — returns false on DB failure
  const removeItem = useCallback(async (productId: string): Promise<boolean> => {
    if (userId) {
      const supabase = createClient();
      const { error } = await supabase.from('cart_items').delete().eq('user_id', userId).eq('product_id', productId);
      if (error) return false;
    }

    const newItems = items.filter((i) => i.productId !== productId);
    setItems(newItems);
    if (!userId) writeLocalCart(newItems);
    return true;
  }, [items, userId]);

  const clearCart = useCallback(async () => {
    if (userId) {
      const supabase = createClient();
      await supabase.from('cart_items').delete().eq('user_id', userId);
    }
    setItems([]);
    if (!userId) writeLocalCart([]);
  }, [userId]);

  const cartItems: CartItemWithProduct[] = items
    .map((i) => {
      const product = products.get(i.productId);
      return product ? { productId: i.productId, quantity: i.quantity, product } : null;
    })
    .filter((i): i is CartItemWithProduct => i !== null);

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const subtotal = cartItems.reduce((sum, i) => {
    const unitPrice = i.product.sale_price ?? i.product.price;
    return sum + unitPrice * i.quantity;
  }, 0);

  const shippingCost = cartItems.length === 0 ? 0
    : subtotal >= site.shipping.freeThreshold ? 0
    : site.shipping.fixedCost;

  const total = subtotal + shippingCost;

  return (
    <CartContext.Provider value={{
      cartItems, cartCount, subtotal, shippingCost, total, loading,
      addItem, updateQuantity, removeItem, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
