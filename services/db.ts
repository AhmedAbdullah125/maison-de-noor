
import { 
  Product, 
  Brand, 
  User, 
  Appointment, 
  UserSubscription, 
  Staff, 
  AccountingEntry, 
  ActivityLog, 
  ActorType, 
  Severity,
  UserNotification,
  NotificationOutbox,
  NotificationResult,
  Manager,
  ManagerPermissions,
  GlobalAddon,
  GlobalAddonItem
} from '../types';
import { DEMO_PRODUCTS, BRANDS } from '../constants';

const DB_KEY = 'salon_db_v1';

interface SalonDB {
  categories: Brand[];
  services: Product[];
  serviceAddons: GlobalAddon[]; 
  users: User[];
  appointments: Appointment[];
  subscriptions: UserSubscription[];
  staff: Staff[];
  accounting: AccountingEntry[];
  logs: ActivityLog[];
  notifications_outbox: NotificationOutbox[];
  user_notifications: UserNotification[];
  managers: Manager[];
}

const FULL_PERMISSIONS: ManagerPermissions = {
  dashboard: true,
  categories: true,
  services: true,
  serviceAddons: true,
  users: true,
  upcomingBookings: true,
  completedBookings: true,
  subscriptions: true,
  staffHR: true,
  accounting: true,
  reports: true,
  notifications: true,
  activityLog: true,
  managers: true
};

class DBService {
  private data: SalonDB;

  constructor() {
    this.data = this.initialize();
    this.migrateLegacyData();
    this.seedManagersIfEmpty();
    this.seedLogsIfEmpty();
    this.seedHistoricalBookingsIfEmpty();
    this.seedAddonsFromDemoProducts(); // Key migration for unification
  }

  private initialize(): SalonDB {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure structure integrity for possibly missing new fields
      return {
        categories: parsed.categories || BRANDS,
        services: parsed.services || DEMO_PRODUCTS,
        serviceAddons: parsed.serviceAddons || [],
        users: parsed.users || [],
        appointments: parsed.appointments || [],
        subscriptions: parsed.subscriptions || [],
        staff: parsed.staff || [],
        accounting: parsed.accounting || [],
        logs: parsed.logs || [],
        notifications_outbox: parsed.notifications_outbox || [],
        user_notifications: parsed.user_notifications || [],
        managers: parsed.managers || []
      };
    }

    return {
      categories: BRANDS,
      services: DEMO_PRODUCTS,
      serviceAddons: [],
      users: [
        { id: 'u1', name: 'Nour', phone: '96555558718', createdAt: new Date().toISOString(), role: 'customer', isActive: true },
        { id: 'u2', name: 'Sara', phone: '96599887766', createdAt: new Date().toISOString(), role: 'customer', isActive: true },
        { id: 'u3', name: 'Mariam', phone: '9655443322', createdAt: new Date().toISOString(), role: 'customer', isActive: true },
        { id: 'u4', name: 'Laila', phone: '96511223344', createdAt: new Date().toISOString(), role: 'customer', isActive: true },
        { id: 'u5', name: 'Dana', phone: '96599009900', createdAt: new Date().toISOString(), role: 'customer', isActive: true }
      ],
      appointments: [],
      subscriptions: [],
      staff: [
        { id: 's1', name: 'Maria Lopez', phone: '9650000001', title: 'Senior Stylist', salary: 850, responsibilities: 'Hair cut, Coloring', vacationBalanceDays: 30, notes: '', isActive: true }
      ],
      accounting: [],
      logs: [],
      notifications_outbox: [],
      user_notifications: [],
      managers: []
    };
  }

  // --- Migration: Convert Inline AddonGroups to GlobalAddons ---
  private seedAddonsFromDemoProducts() {
    let hasChanges = false;
    
    // Check if we need to migrate "Advanced Hair Treatment" (ID 104) inline addons to Global Addons
    const targetService = this.data.services.find(s => s.id === 104);
    
    if (targetService && targetService.addonGroups && targetService.addonGroups.length > 0) {
      // If this service has inline addonGroups but NO globalAddonIds (or we want to merge),
      // let's create global addons for them and link them.
      
      const newGlobalIds: string[] = targetService.globalAddonIds || [];

      targetService.addonGroups.forEach(group => {
        // Check if a global addon with this title already exists to avoid duplicates
        const existingGlobal = this.data.serviceAddons.find(ga => ga.titleAr === group.title_ar);
        
        if (existingGlobal) {
          if (!newGlobalIds.includes(existingGlobal.id)) {
            newGlobalIds.push(existingGlobal.id);
            hasChanges = true;
          }
        } else {
          // Create new Global Addon
          const newId = `ga_migrated_${group.id}_${Date.now()}`;
          const newGlobal: GlobalAddon = {
            id: newId,
            titleEn: group.id, // Fallback as we only have AR title usually in demo
            titleAr: group.title_ar,
            required: group.required,
            selectionType: group.type === 'single' ? 'single' : 'multiple',
            items: group.options.map(opt => ({
              id: opt.id,
              labelEn: opt.title_ar, // Fallback
              labelAr: opt.title_ar,
              price: opt.price_kwd
            })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          this.data.serviceAddons.push(newGlobal);
          newGlobalIds.push(newId);
          hasChanges = true;
        }
      });

      // Update the service
      targetService.globalAddonIds = newGlobalIds;
      // Optionally clear inline groups to enforce usage of global catalog, 
      // but keeping them for safety is fine as long as UI prioritizes one or merges.
      // For this unified source goal, we will CLEAR them to prove migration worked.
      delete targetService.addonGroups; 
      hasChanges = true;
    }

    // Ensure subscriptions are present for Service 104 if missing in DB but present in Seed
    const demo104 = DEMO_PRODUCTS.find(p => p.id === 104);
    if (targetService && demo104 && demo104.subscriptions && (!targetService.subscriptions || targetService.subscriptions.length === 0)) {
        targetService.subscriptions = demo104.subscriptions;
        hasChanges = true;
    }

    if (hasChanges) {
      this.save();
    }
  }

  private seedManagersIfEmpty() {
    if (this.data.managers && this.data.managers.length > 0) return;
    
    this.data.managers = [
      {
        id: 'm1',
        fullName: 'Super Admin',
        username: 'admin',
        email: 'admin@salon.com',
        password: '000000',
        role: 'super_admin',
        permissions: { ...FULL_PERMISSIONS },
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: null
      },
      {
        id: 'm2',
        fullName: 'Noor Manager',
        username: 'noor',
        email: 'noor@salon.com',
        password: '000000',
        role: 'admin',
        permissions: {
          ...FULL_PERMISSIONS,
          accounting: false,
          staffHR: false,
          reports: false,
          managers: false
        },
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: null
      }
    ];
    this.save();
  }

  private seedHistoricalBookingsIfEmpty() {
    if (this.data.appointments.length > 5) return; // Only seed if empty/minimal

    const historical: Appointment[] = [];
    const now = new Date();
    
    // Seed ~150 completed bookings over the last 60 days
    for (let i = 0; i < 150; i++) {
      const dayOffset = Math.floor(Math.random() * 60);
      const date = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      const service = DEMO_PRODUCTS[Math.floor(Math.random() * DEMO_PRODUCTS.length)];
      const user = this.data.users[Math.floor(Math.random() * this.data.users.length)];
      
      const basePrice = parseFloat(service.price.replace(/[^\d.]/g, ''));
      
      historical.push({
        id: `h_apt_${i}`,
        userId: user.id,
        serviceId: service.id,
        serviceName: service.name,
        durationMinutes: 60,
        dateISO: date.toISOString().split('T')[0],
        time24: "14:00",
        pricePaidNow: basePrice,
        status: "completed",
        createdAt: date.toISOString(),
        bookingType: "SALON"
      });

      // Also create accounting entries for these to keep DB consistent
      this.data.accounting.push({
        id: `h_acc_${i}`,
        type: 'income',
        amount: basePrice,
        date: date.toISOString().split('T')[0],
        category: 'Service Booking',
        note: `Completed: ${service.name}`,
        linkedBookingId: `h_apt_${i}`
      });
    }

    this.data.appointments = [...this.data.appointments, ...historical];
    this.save();
  }

  private seedLogsIfEmpty() {
    if (this.data.logs.length > 0) return;
    const actors: {name: string, type: ActorType}[] = [
      { name: 'Admin', type: 'admin' },
      { name: 'Nour', type: 'customer' },
      { name: 'Maria Lopez', type: 'staff' },
      { name: 'System', type: 'system' }
    ];
    const actions = [
      { type: 'create', title: 'Entity Created', severity: 'info' as Severity },
      { type: 'update', title: 'Data Updated', severity: 'info' as Severity },
      { type: 'delete', title: 'Record Removed', severity: 'danger' as Severity },
      { type: 'login', title: 'User Login', severity: 'info' as Severity },
      { type: 'booking', title: 'New Booking', severity: 'info' as Severity },
      { type: 'payment', title: 'Payment Success', severity: 'info' as Severity },
      { type: 'status-change', title: 'Status Changed', severity: 'warning' as Severity }
    ];
    const entities = ['Category', 'Service', 'User', 'Booking', 'Subscription', 'Staff'];
    const seededLogs: ActivityLog[] = [];
    const now = new Date();
    for (let i = 0; i < 300; i++) {
      const actor = actors[Math.floor(Math.random() * actors.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const entity = entities[Math.floor(Math.random() * entities.length)];
      const date = new Date(now.getTime() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
      seededLogs.push({
        id: `log_seed_${i}`,
        timestamp: date.toISOString(),
        actorType: actor.type,
        actorName: actor.name,
        actionType: action.type,
        entityType: entity,
        entityId: `${entity.toLowerCase()}_${Math.floor(Math.random() * 1000)}`,
        entityName: `${entity} ${i}`,
        shortTitle: action.title,
        details: `Auto-generated log for ${action.type} on ${entity}. Operation performed by ${actor.name}.`,
        severity: action.severity,
        ip: `192.168.1.${Math.floor(Math.random() * 254)}`,
        device: Math.random() > 0.5 ? 'iPhone 15 Pro (Safari)' : 'Windows PC (Chrome)'
      });
    }
    this.data.logs = seededLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    this.save();
  }

  private migrateLegacyData() {
    const oldBookings = localStorage.getItem('mezo_bookings_v1');
    if (oldBookings && this.data.appointments.length <= 150) {
      const parsed = JSON.parse(oldBookings);
      this.data.appointments = [...this.data.appointments, ...parsed.map((b: any) => ({
        id: b.id,
        userId: 'u1',
        serviceId: 101,
        serviceName: b.packageName || 'Service',
        durationMinutes: 60,
        dateISO: b.date,
        time24: b.time || '09:00',
        status: b.status.includes('مؤكد') ? 'upcoming' : 'completed',
        createdAt: new Date().toISOString()
      }))];
      this.save();
    }
  }

  save() {
    localStorage.setItem(DB_KEY, JSON.stringify(this.data));
    window.dispatchEvent(new Event('storage'));
  }

  getData(): SalonDB {
    return this.data;
  }

  addLog(
    actorName: string, 
    actorType: ActorType, 
    actionType: string, 
    entityType: string, 
    entityId: string, 
    shortTitle: string, 
    details: string,
    severity: Severity = 'info',
    entityName?: string
  ) {
    const newLog: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorType,
      actionType,
      entityType,
      entityId,
      entityName,
      shortTitle,
      details,
      severity,
      ip: '127.0.0.1', 
      device: navigator.userAgent.split(')')[0] + ')'
    };
    this.data.logs.unshift(newLog);
    this.save();
  }

  getUserNotifications(userId: string): UserNotification[] {
    return this.data.user_notifications.filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  markUserNotificationRead(notificationId: string) {
    const idx = this.data.user_notifications.findIndex(n => n.id === notificationId);
    if (idx !== -1) {
      this.data.user_notifications[idx].isRead = true;
      this.save();
    }
  }

  sendNotificationToAll(messageText: string, linkUrl: string = '', sentByAdminId: string, sentByAdminName: string): NotificationOutbox {
    const users = this.data.users;
    const outboxId = `out_${Date.now()}`;
    const results: NotificationResult[] = [];
    let successCount = 0;
    let failCount = 0;

    users.forEach(u => {
      try {
        const userNotif: UserNotification = {
          id: `un_${Date.now()}_${u.id}`,
          userId: u.id,
          createdAt: new Date().toISOString(),
          messageText,
          linkUrl,
          isRead: false
        };
        this.data.user_notifications.push(userNotif);
        results.push({ userId: u.id, userName: u.name, status: 'success' });
        successCount++;
      } catch (err) {
        results.push({ userId: u.id, userName: u.name, status: 'failed', errorReason: 'Internal Error' });
        failCount++;
      }
    });

    const outboxEntry: NotificationOutbox = {
      id: outboxId,
      createdAt: new Date().toISOString(),
      sentByAdminId,
      sentByAdminName,
      messageText,
      linkUrl,
      target: 'all_users',
      totalUsers: users.length,
      successCount,
      failCount,
      results
    };

    this.data.notifications_outbox.unshift(outboxEntry);
    this.save();

    this.addLog(sentByAdminName, 'admin', 'broadcast', 'Notification', outboxId, 'Broadcast Sent', `Sent message to ${users.length} users`);

    return outboxEntry;
  }

  deleteNotificationFromOutbox(id: string) {
    this.data.notifications_outbox = this.data.notifications_outbox.filter(n => n.id !== id);
    this.save();
  }
  
  updateEntity<T extends keyof SalonDB>(collection: T, id: string | number, newData: any) {
    const items = this.data[collection] as any[];
    const idx = items.findIndex((i: any) => i.id == id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...newData };
      this.save();
      return true;
    }
    return false;
  }

  deleteEntity<T extends keyof SalonDB>(collection: T, id: string | number) {
    const items = this.data[collection] as any[];
    this.data[collection] = items.filter((i: any) => i.id != id) as any;
    this.save();
  }

  addEntity<T extends keyof SalonDB>(collection: T, item: any) {
    (this.data[collection] as any[]).push(item);
    this.save();
  }
}

export const db = new DBService();
