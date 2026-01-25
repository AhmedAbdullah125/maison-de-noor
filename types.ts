

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

export interface ServicePackageOption {
  id: string;
  sessionsCount: number;
  discountPercent: number;
  titleText: string;
  isEnabled: boolean;
  sortOrder: number;
  validityDays: number; // New field for package validity
}

export type ProductType = 'simple' | 'addons' | 'package';

export interface Product {
  id: number;
  name: string;
  type: ProductType; // New field to distinguish service types
  price: string; // Base price string e.g. "7.000 د.ك"
  oldPrice?: string;
  image: string; // Primary thumbnail
  images?: string[]; // New: Gallery images
  description?: string;
  duration?: string;
  addons?: ServiceAddon[]; // Legacy flat addons
  addonGroups?: ServiceAddonGroup[]; // New grouped addons
  packageOptions?: ServicePackageOption[]; // New dashboard-driven CTA packages
  isHomeService?: boolean; // New flag for Home Services
}

export interface Brand {
  id: number;
  name: string;
  image: string;
  productIds: number[];
}

export interface UserSubscription {
  id: string;
  serviceId: number;
  packageTitle: string;
  status: 'active' | 'expired' | 'paused';
  sessionsTotal: number;
  sessionsUsed: number;
  expiryDate: string; 
  nextSession?: {
    date: string;
    time: string;
  };
  minGapDays: number;
  durationMinutes: number;
  purchaseDate: string;
}

export interface Address {
  area: string;
  block: string;
  street: string;
  building: string;
  apartment?: string;
  notes?: string;
}

// Replaces CartItem - Represents the single item being booked
export interface BookingItem {
  product: Product;
  quantity: number;
  selectedAddons?: ServiceAddon[];
  packageOption?: ServicePackageOption;
  customFinalPrice?: number;
}

export interface Appointment {
  id: string;
  source: "subscription" | "service";
  subscriptionId?: string;
  serviceId: string | number;
  serviceName: string;
  durationMinutes: number;
  dateISO: string; // YYYY-MM-DD
  time24: string; // HH:mm
  pricePaidNow?: number;
  status: "upcoming" | "completed" | "canceled";
  createdAt: string;
  bookingType?: 'SALON' | 'HOME_SERVICE'; // New field
  address?: Address; // New field
}

export type TabId = 'home' | 'subscriptions' | 'notifications' | 'appointments' | 'account';