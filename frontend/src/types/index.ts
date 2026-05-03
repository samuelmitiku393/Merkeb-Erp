// ─────────────────────────────────────────────
//  Auth / User
// ─────────────────────────────────────────────
export interface User {
  _id: string;
  username: string;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatar?: string;
  role: 'admin' | 'user';
}

export interface AuthContextType {
  user: User | null;
  login: (
    username: string,
    password: string
  ) => Promise<{ success: true; user: User } | { success: false; error: string }>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

// ─────────────────────────────────────────────
//  Product / Inventory
// ─────────────────────────────────────────────
export interface ProductSize {
  size: string;
  stock: number;
}

export interface Product {
  _id: string;
  name: string;
  team?: string;
  price: number;
  costPrice: number;
  sizes: ProductSize[];
}

// ─────────────────────────────────────────────
//  Customer
// ─────────────────────────────────────────────
export interface Customer {
  _id: string;
  name: string;
  phone: string;
  address?: string;
  instagramHandle?: string;
}

// ─────────────────────────────────────────────
//  Orders
// ─────────────────────────────────────────────
export interface OrderItemProduct {
  _id: string;
  name: string;
}

export interface OrderItem {
  _id?: string;
  product: OrderItemProduct | string;
  size: string;
  quantity: number;
  price: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered';

export interface Order {
  _id: string;
  customer: {
    name: string;
    phone: string;
    address?: string;
  };
  items: OrderItem[];
  status: OrderStatus;
  totalPrice: number;
  createdAt?: string;
}

// ─────────────────────────────────────────────
//  Dashboard Analytics
// ─────────────────────────────────────────────
export interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  revenue: number;
  pendingOrders: number;
}

export interface ProfitData {
  totalRevenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
}

export interface ProductStat {
  productName: string;
  team?: string;
  totalQuantity: number;
  totalRevenue: number;
}

// ─────────────────────────────────────────────
//  Inventory helpers
// ─────────────────────────────────────────────
export interface LowStockItem {
  productId: string;
  productName: string;
  size: string;
  stock: number;
  team?: string;
}

export interface RestockSuggestion {
  productId: string;
  productName: string;
  size: string;
  currentStock: number;
  reorderQty: number;
  estimatedDailyDemand: number;
  team?: string;
}

// ─────────────────────────────────────────────
//  Audit Trail
// ─────────────────────────────────────────────
export interface AuditLog {
  _id: string;
  action: string;
  entity: string;
  entityId?: string;
  description: string;
  performedByUsername: string;
  performedByRole: string;
  ipAddress?: string;
  timestamp: string;
  changes?: Record<string, unknown>;
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}

export interface AuditFilters {
  action: string;
  entity: string;
  search: string;
  startDate: string;
  endDate: string;
}

export interface AuditFilterOptions {
  actions: string[];
  entities: string[];
  users: string[];
}

export interface AuditStats {
  todayCount: number;
  weekCount: number;
  monthCount: number;
  actionBreakdown?: Array<{ _id: string; count: number }>;
}

// ─────────────────────────────────────────────
//  Notifications
// ─────────────────────────────────────────────
export type NotificationType = 'warning' | 'info' | 'success';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  time: string;
}

// ─────────────────────────────────────────────
//  UI helpers
// ─────────────────────────────────────────────
export type SnackbarSeverity = 'success' | 'error' | 'warning' | 'info';

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
}
