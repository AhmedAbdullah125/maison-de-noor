import {
  DEMO_PRODUCTS,
  BRANDS,
  INITIAL_SUBSCRIPTIONS,
  STORAGE_KEY_SUBSCRIPTIONS,
  STORAGE_KEY_APPOINTMENTS
} from '../constants';
import { Product, Brand, UserSubscription, Appointment } from '../types';

// Cache Configuration
// Bumped to v1.10 to include new 'Special Offers' category
const CACHE_VERSION = 'v1.10';
const STORAGE_PREFIX = 'mezo_cache_';
const IMAGE_CACHE_NAME = 'mezo-banners-cache-v1';

// TTL Configuration (in milliseconds)
const TTL_CONFIG = {
  categories: 24 * 60 * 60 * 1000, // 24 Hours
  services: 24 * 60 * 60 * 1000,   // 24 Hours
  banners: 6 * 60 * 60 * 1000,     // 6 Hours
  subscriptions: 10 * 60 * 1000,   // 10 Minutes
  appointments: 10 * 60 * 1000,    // 10 Minutes
  profile: 24 * 60 * 60 * 1000     // 24 Hours
};

interface CacheMetadata {
  version: string;
  timestamp: number;
}

interface CachedItem<T> {
  data: T;
  metadata: CacheMetadata;
}

export const CacheKeys = {
  CATEGORIES: 'categories',
  SERVICES: 'services',
  BANNERS: 'banners',
  SUBSCRIPTIONS: 'subscriptions',
  APPOINTMENTS: 'appointments',
  PROFILE: 'profile'
};

class CacheService {
  constructor() {
    this.checkVersion();
  }

  // Clear cache if version changes
  private checkVersion() {
    const storedVersion = localStorage.getItem(`${STORAGE_PREFIX}version`);
    if (storedVersion !== CACHE_VERSION) {
      // 1. Clear LocalStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      localStorage.removeItem(STORAGE_KEY_SUBSCRIPTIONS);

      // 2. Clear Cache Storage (Images)
      if ('caches' in window) {
        caches.delete(IMAGE_CACHE_NAME).then(() => {
        });
      }

      localStorage.setItem(`${STORAGE_PREFIX}version`, CACHE_VERSION);
    }
  }

  private getKey(key: string): string {
    if (key === CacheKeys.SUBSCRIPTIONS) return STORAGE_KEY_SUBSCRIPTIONS;
    if (key === CacheKeys.APPOINTMENTS) return STORAGE_KEY_APPOINTMENTS;
    return `${STORAGE_PREFIX}${key}`;
  }

  save<T>(key: string, data: T): void {
    const cacheKey = this.getKey(key);

    if (key === CacheKeys.SUBSCRIPTIONS || key === CacheKeys.APPOINTMENTS) {
      localStorage.setItem(cacheKey, JSON.stringify(data));
      const metaKey = `${STORAGE_PREFIX}${key}_meta`;
      const meta: CacheMetadata = { version: CACHE_VERSION, timestamp: Date.now() };
      localStorage.setItem(metaKey, JSON.stringify(meta));
      return;
    }

    const item: CachedItem<T> = {
      data,
      metadata: {
        version: CACHE_VERSION,
        timestamp: Date.now()
      }
    };
    localStorage.setItem(cacheKey, JSON.stringify(item));
  }

  load<T>(key: string): T | null {
    const cacheKey = this.getKey(key);
    const raw = localStorage.getItem(cacheKey);

    if (!raw) return null;

    if (key === CacheKeys.SUBSCRIPTIONS || key === CacheKeys.APPOINTMENTS) {
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    }

    try {
      const item = JSON.parse(raw) as CachedItem<T>;
      return item.data;
    } catch {
      return null;
    }
  }

  needsRefresh(key: string): boolean {
    const ttl = TTL_CONFIG[key as keyof typeof TTL_CONFIG];
    if (!ttl) return true;

    let timestamp = 0;

    if (key === CacheKeys.SUBSCRIPTIONS || key === CacheKeys.APPOINTMENTS) {
      const metaRaw = localStorage.getItem(`${STORAGE_PREFIX}${key}_meta`);
      if (!metaRaw) return true;
      const meta = JSON.parse(metaRaw) as CacheMetadata;
      timestamp = meta.timestamp;
    } else {
      const cacheKey = this.getKey(key);
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return true;
      const item = JSON.parse(raw) as CachedItem<any>;
      timestamp = item.metadata.timestamp;
    }

    const age = Date.now() - timestamp;
    return age > ttl;
  }

  // --- Image Caching Logic (Service Worker Strategy Mock) ---

  /**
   * Prefetches banner images and stores them in the browser's Cache Storage.
   * This ensures next time the image is requested by <img src>, it serves from disk.
   */
  async prefetchBanners(banners: { id: number, image: string }[]) {
    if (!('caches' in window)) return;

    try {
      const cache = await caches.open(IMAGE_CACHE_NAME);
      const urls = banners.map(b => b.image);

      // Check which are already cached
      const promises = urls.map(async (url) => {
        const match = await cache.match(url);
        if (!match) {
          // If not in cache, fetch and put
          try {
            await cache.add(url);
          } catch (err) {
            console.warn(`Failed to cache banner ${url}`, err);
          }
        }
      });

      await Promise.all(promises);
    } catch (err) {
      console.error('Error accessing Cache Storage', err);
    }
  }

  // --- Warmup Logic ---

  async warmup(): Promise<void> {

    // 1. Categories
    if (this.needsRefresh(CacheKeys.CATEGORIES)) {
      this.save(CacheKeys.CATEGORIES, BRANDS);
    }

    // 2. Services / Products
    if (this.needsRefresh(CacheKeys.SERVICES)) {
      this.save(CacheKeys.SERVICES, DEMO_PRODUCTS);
    }

    // 3. Subscriptions
    if (this.needsRefresh(CacheKeys.SUBSCRIPTIONS)) {
      const current = this.load<UserSubscription[]>(CacheKeys.SUBSCRIPTIONS);
      if (!current) {
        this.save(CacheKeys.SUBSCRIPTIONS, []);
      }
    }

    // 4. Appointments
    if (this.needsRefresh(CacheKeys.APPOINTMENTS)) {
      const current = this.load<Appointment[]>(CacheKeys.APPOINTMENTS);
      if (!current) {
        this.save(CacheKeys.APPOINTMENTS, []);
      }
    }

    // 5. Banners (Metadata + Image Prefetching)
    if (this.needsRefresh(CacheKeys.BANNERS)) {
      const banners = [
        { id: 1, image: 'https://raiyansoft.com/wp-content/uploads/2026/01/b2.jpg' },
        { id: 2, image: 'https://raiyansoft.com/wp-content/uploads/2026/01/b1.jpg' },
      ];
      // Save metadata to LocalStorage (lightweight)
      this.save(CacheKeys.BANNERS, banners);

      // Save images to Cache Storage (heavyweight)
      this.prefetchBanners(banners);
    } else {
      // Even if metadata isn't expired, ensure images are in CacheStorage (re-verify)
      const banners = this.load<{ id: number, image: string }[]>(CacheKeys.BANNERS);
      if (banners) {
        this.prefetchBanners(banners);
      }
    }

  }

  getInitialData() {
    return {
      categories: this.load<Brand[]>(CacheKeys.CATEGORIES) || BRANDS,
      services: this.load<Product[]>(CacheKeys.SERVICES) || DEMO_PRODUCTS,
      subscriptions: this.load<UserSubscription[]>(CacheKeys.SUBSCRIPTIONS) || [],
      banners: this.load<{ id: number, image: string }[]>(CacheKeys.BANNERS) || [],
    };
  }
}

export const cacheService = new CacheService();