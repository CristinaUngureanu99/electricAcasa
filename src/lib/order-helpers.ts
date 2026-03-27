import type {
  OrderStatus,
  PaymentStatus,
  OfferStatus,
  PackageRequestStatus,
} from '@/types/database';

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'In asteptare',
  confirmed: 'Confirmata',
  shipped: 'Expediata',
  delivered: 'Livrata',
  cancelled: 'Anulata',
};

export const orderStatusVariants: Record<
  OrderStatus,
  'warning' | 'info' | 'success' | 'danger' | 'neutral'
> = {
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

export const offerStatusLabels: Record<OfferStatus, string> = {
  pending: 'In asteptare',
  accepted: 'Acceptata',
  rejected: 'Refuzata',
  closed: 'Inchisa',
};

export const offerStatusVariants: Record<OfferStatus, 'warning' | 'success' | 'neutral'> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'neutral',
  closed: 'neutral',
};

export const requestStatusLabels: Record<PackageRequestStatus, string> = {
  new: 'Noua',
  in_review: 'In analiza',
  answered: 'Oferta trimisa',
  closed: 'Inchisa',
};
