export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  created_at: string;
}

// -- Categories --

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent_id: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// -- Products --

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string | null;
  brand_name: string;
  price: number;
  sale_price: number | null;
  category_id: string | null;
  stock: number;
  images: string[];
  specs: ProductSpec[];
  datasheet_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductSpec {
  key: string;
  value: string;
}

export type ProductRelationType = 'compatible';

export interface ProductRelation {
  product_id: string;
  related_product_id: string;
  type: ProductRelationType;
}

// -- Addresses --

export type AddressType = 'shipping' | 'billing';

export interface Address {
  id: string;
  user_id: string;
  type: AddressType;
  name: string;
  street: string;
  city: string;
  county: string;
  postal_code: string;
  phone: string;
  is_default: boolean;
  created_at: string;
}

// -- Orders --

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'ramburs';

export interface Order {
  id: string;
  order_number: number;
  user_id: string;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_address: OrderAddress;
  billing_address: OrderAddress | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  stripe_session_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderAddress {
  name: string;
  street: string;
  city: string;
  county: string;
  postal_code: string;
  phone: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
}

// -- Cart --

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
}

// -- Package Requests --

export type PackageRequestStatus = 'new' | 'in_review' | 'answered' | 'closed';

export interface PackageRequest {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  description: string;
  attachment_url: string | null;
  status: PackageRequestStatus;
  admin_notes: string | null;
  created_at: string;
}

// -- Newsletter --

export interface NewsletterSubscription {
  id: string;
  email: string;
  user_id: string | null;
  is_active: boolean;
  created_at: string;
}
