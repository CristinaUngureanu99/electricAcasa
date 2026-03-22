import type { OrderStatus, PaymentStatus } from '@/types/database';

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'In asteptare',
  confirmed: 'Confirmata',
  shipped: 'Expediata',
  delivered: 'Livrata',
  cancelled: 'Anulata',
};

export const orderStatusVariants: Record<OrderStatus, 'warning' | 'info' | 'success' | 'danger' | 'neutral'> = {
  pending: 'warning',
  confirmed: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: 'In asteptare',
  paid: 'Platita',
  failed: 'Esuata',
  refunded: 'Rambursata',
};
