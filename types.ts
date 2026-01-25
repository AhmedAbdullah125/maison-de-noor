
// @google/genai used in services/audioService.ts (placeholder)

export interface ServiceAddon {
  id: string;
  title_ar: string;
  desc_ar?: string;
  price_kwd: number;
  is_active: boolean;
}

export interface ServiceAddonGroup {
  id: string;
  title_ar: string;
  type: 'single' | 'multi';
  required: boolean;
  options: ServiceAddon[];
}

/** Global Add-ons Catalog Types */
export interface GlobalAddonItem {
  id: string;
  labelEn: string;
  labelAr: string;
  price: number;
}

export interface GlobalAddon {
  id: string;
  titleEn: string;
  titleAr: string;
  required: boolean;
  selectionType: 'single' | 'multiple';
  items: GlobalAddonItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceSubscription {
  id: string;
  title: string;
  sessionsCount: number;
  pricePercent: number;
  validityDays: number;
}

export interface ServicePackageOption {
  id: string;
  sessionsCount: number;
  discountPercent: number;
  titleText: string;
  isEnabled: boolean;
  sortOrder: number;
  validityDays: number;
}

// ProductType alias removed

export interface Product {
  id: number;
  name: string;
  nameEn?: string; // Added optional English name
  // type property removed
  price: string;
  oldPrice?: string;
  image: string;
  images?: string[];
  description?: string;
  duration?: string;
  addons?: ServiceAddon[];
  addonGroups?: ServiceAddonGroup[];
  globalAddonIds?: string[]; // References to GlobalAddon catalog
  packageOptions?: ServicePackageOption[];
  subscriptions?: ServiceSubscription[];
  isHomeService?: boolean;
}

export interface Brand {
  id: number;
  name: string;
  nameEn?: string;
  image: string;
  productIds: number[];
}

export interface UserSubscription {
  id: string;
  userId?: string;
  serviceId: number;
  packageTitle: string;
  status: 'active' | 'expired' | 'paused';
  sessionsTotal: number;
  sessionsUsed: number;
  expiryDate: string; 
  purchaseDate: string;
  validityDays?: number;
  minGapDays?: number;
  durationMinutes?: number;
  nextSession?: { date: string; time: string };
}

export interface User {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  role: 'customer' | 'admin' | 'manager' | 'staff';
  isActive: boolean;
}

export interface Staff {
  id: string;
  name: string;
  phone: string;
  title: string;
  salary: number;
  responsibilities: string;
  vacationBalanceDays: number;
  notes: string;
  isActive: boolean;
}

export interface AccountingEntry {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  category: string;
  note: string;
  linkedBookingId?: string;
}

export type Severity = 'info' | 'warning' | 'danger';
export type ActorType = 'admin' | 'staff' | 'customer' | 'system';

export interface ActivityLog {
  id: string;
  timestamp: string;
  actorType: ActorType;
  actorName: string;
  actionType: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  shortTitle: string;
  details: string;
  severity: Severity;
  ip: string;
  device: string;
}

// --- Manager & Permissions ---

export interface ManagerPermissions {
  dashboard: boolean;
  categories: boolean;
  services: boolean;
  serviceAddons: boolean; // Added
  users: boolean;
  upcomingBookings: boolean;
  completedBookings: boolean;
  subscriptions: boolean;
  staffHR: boolean;
  accounting: boolean;
  reports: boolean;
  notifications: boolean;
  activityLog: boolean;
  managers: boolean;
}

export interface Manager {
  id: string;
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: 'super_admin' | 'admin' | 'viewer';
  permissions: ManagerPermissions;
  status: 'active' | 'disabled';
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

// --- Notification Interfaces ---

export interface UserNotification {
  id: string;
  userId: string;
  createdAt: string;
  messageText: string;
  linkUrl?: string;
  isRead: boolean;
}

export interface NotificationResult {
  userId: string;
  userName: string;
  status: 'success' | 'failed';
  errorReason?: string;
}

export interface NotificationOutbox {
  id: string;
  createdAt: string;
  sentByAdminId: string;
  sentByAdminName: string;
  messageText: string;
  linkUrl?: string;
  target: 'all_users';
  totalUsers: number;
  successCount: number;
  failCount: number;
  results: NotificationResult[];
}

export interface Appointment {
  id: string;
  userId?: string;
  serviceId: string | number;
  serviceName: string;
  durationMinutes: number;
  dateISO: string;
  time24: string;
  pricePaidNow?: number;
  status: "upcoming" | "completed" | "canceled";
  createdAt: string;
  staffId?: string;
  notes?: string;
  source?: 'subscription' | 'service';
  subscriptionId?: string;
  bookingType?: 'SALON' | 'HOME_SERVICE';
  address?: {
    area: string;
    block: string;
    street: string;
    building: string;
    apartment?: string;
  };
}

export interface BookingItem {
  product: Product;
  quantity: number;
  selectedAddons?: ServiceAddon[];
  packageOption?: ServicePackageOption;
  customFinalPrice?: number;
}

export type TabId = 'home' | 'subscriptions' | 'notifications' | 'appointments' | 'account';
