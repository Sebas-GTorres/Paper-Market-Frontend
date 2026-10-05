// ─── Auth ────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  names: string;
  surnames: string;
  document: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  profilePhoto?: string;
  roleId: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: UserResponse;
}

// ─── Role ────────────────────────────────────────────────
export interface RoleResponse {
  id: number;
  name: string;
  description: string;
}

// ─── User ────────────────────────────────────────────────
export type UserState = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'SUSPENDED';

export interface UserResponse {
  id: number;
  names: string;
  surnames: string;
  document: string;
  email: string;
  phone: string | null;
  address: string | null;
  profilePhoto: string | null;
  state: UserState;
  registrationDate: string;
  lastAccess: string | null;
  role: RoleResponse;
}

export interface UpdateUserRequest {
  names: string;
  surnames: string;
  phone?: string;
  address?: string;
  profilePhoto?: string;
}

// ─── Category ────────────────────────────────────────────
export interface CategoryResponse {
  id: number;
  name: string;
  description: string;
  status: boolean;
}

export interface CategoryRequest {
  name: string;
  description: string;
}

// ─── Supplier ────────────────────────────────────────────
export interface SupplierResponse {
  id: number;
  name: string;
  nit: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  contactPerson: string | null;
  status: boolean;
}

export interface SupplierRequest {
  name: string;
  nit: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
}

// ─── Product ─────────────────────────────────────────────
export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  barcode: string;
  brand: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minimumStock: number;
  image: string | null;
  status: boolean;
  category?: CategoryResponse;
  supplier?: SupplierResponse;
}

export interface ProductRequest {
  name: string;
  description?: string;
  barcode?: string;
  brand?: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minimumStock: number;
  image?: string | null;
  categoryId: number;
  supplierId: number;
}

// ─── Customer ────────────────────────────────────────────
export type CustomerStatus = 'ACTIVE' | 'INACTIVE';

export interface CustomerResponse {
  id: number;
  names: string;
  surnames: string;
  document: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: CustomerStatus;
  registrationDate: string;
  userId: number | null; // ID del User vinculado (null si fue creado manualmente por admin)
}

export interface CustomerRequest {
  names: string;
  surnames: string;
  document: string;
  email?: string;
  phone?: string;
  address?: string;
}

// ─── Cart ────────────────────────────────────────────────
export interface CartItemResponse {
  id: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  image?: string | null;
}

export interface CartResponse {
  id: number;
  createdAt: string;
  total: number;
  customerId: number;
  items: CartItemResponse[];
}

export interface AddCartItemRequest {
  productId: number;
  quantity: number;
}

// ─── Order ───────────────────────────────────────────────
export type OrderStatus = 'PENDING' | 'PAID' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELED';

export interface OrderDetailResponse {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  deliveryAddress: string;
  notes: string | null;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string | null;
  customerId: number;
  customerName?: string;
  details: OrderDetailResponse[];
}

export interface CreateOrderRequest {
  deliveryAddress: string;
  notes?: string;
  customerId: number;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

// ─── Sale ────────────────────────────────────────────────
export interface SaleDetailResponse {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SaleResponse {
  id: number;
  saleNumber: string;
  total: number;
  discountPercent: number;
  createdAt: string;
  customerId: number | null;
  userId: number;
  details: SaleDetailResponse[];
}

export interface SaleDetailRequest {
  productId: number;
  quantity: number;
}

export interface CreateSaleRequest {
  customerId: number | null;
  userId: number;
  discountPercent: number;
  details: SaleDetailRequest[];
}

// ─── Purchase ────────────────────────────────────────────
export interface PurchaseDetailResponse {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface PurchaseResponse {
  id: number;
  purchaseNumber: string;
  total: number;
  createdAt: string;
  supplierId: number;
  supplierName?: string;
  userId: number;
  details: PurchaseDetailResponse[];
}

export interface PurchaseDetailRequest {
  productId: number;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseRequest {
  supplierId: number;
  userId: number;
  details: PurchaseDetailRequest[];
}

// ─── API Error ───────────────────────────────────────────
export type ApiErrorCode =
  | 'BAD_REQUEST_ERROR'
  | 'INSUFFICIENT_STOCK'
  | 'VALIDATION_FAILED'
  | 'AUTHENTICATION_REQUIRED'
  | 'ACCESS_DENIED'
  | 'USER_ACCOUNT_DISABLED'
  | 'RESOURCE_NOT_FOUND'
  | 'RESOURCE_ALREADY_EXISTS'
  | 'INTERNAL_SERVER_ERROR';

export interface ApiError {
  timestamp: string;
  message: string;
  details: string;
  errorCode: ApiErrorCode;
  errors?: Record<string, string>;
}

// ─── Toast ───────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}
