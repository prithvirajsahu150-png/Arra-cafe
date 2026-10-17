import fs from 'node:fs';
import path from 'node:path';
import { MENU_ITEMS } from '../../data/menu';
import { hashPassword } from '../auth';
import {
  MenuItemModel,
  OfferModel,
  BookingModel,
  PaymentModel,
  AdminUserModel,
} from './types';

export * from './types';

const DB_DIR = path.join(process.cwd(), 'data', 'db');

const FILES = {
  menu: path.join(DB_DIR, 'menu.json'),
  offers: path.join(DB_DIR, 'offers.json'),
  bookings: path.join(DB_DIR, 'bookings.json'),
  payments: path.join(DB_DIR, 'payments.json'),
  admins: path.join(DB_DIR, 'admins.json'),
};

function ensureDbDirectory() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  ensureDbDirectory();
  try {
    if (!fs.existsSync(filePath)) {
      writeJsonAtomic(filePath, defaultValue);
      return defaultValue;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

function writeJsonAtomic<T>(filePath: string, data: T): void {
  ensureDbDirectory();
  const tempPath = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(2, 7)}.tmp`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch {
      // ignore
    }
    throw err;
  }
}

/**
 * Automatically migrate existing 129 menu items and default offers/admin on initialization.
 * Safe migration: runs only once or ensures no duplicates.
 */
function initDatabase() {
  ensureDbDirectory();

  // 1. Menu Items Migration
  const currentMenu = readJsonFile<MenuItemModel[]>(FILES.menu, []);
  if (currentMenu.length === 0) {
    console.log(`[Database Migration] Migrating ${MENU_ITEMS.length} menu items from data/menu.ts...`);
    const migratedItems: MenuItemModel[] = MENU_ITEMS.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      image: item.image ? item.image.replace(/^\/public/, '') : null,
      description: item.description || '',
      available: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    writeJsonAtomic(FILES.menu, migratedItems);
    console.log(`[Database Migration] Successfully migrated ${migratedItems.length} menu items.`);
  }

  // 2. Default Offers Migration
  const currentOffers = readJsonFile<OfferModel[]>(FILES.offers, []);
  if (currentOffers.length === 0) {
    const defaultOffers: OfferModel[] = [
      {
        id: 'off-1',
        title: 'FIRST ORDER SPECIAL',
        discount: '15% OFF',
        description: 'Get 15% off on your first food delivery order.',
        couponCode: 'ARRA15',
        startDate: null,
        endDate: null,
        active: true,
        offerType: 'PERCENTAGE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'off-2',
        title: 'WEEKEND TREAT',
        discount: '20% OFF',
        description: 'Enjoy your favourite dishes every Saturday & Sunday.',
        couponCode: 'WEEKEND20',
        startDate: null,
        endDate: null,
        active: true,
        offerType: 'PERCENTAGE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'off-3',
        title: 'BIRTHDAY SPECIAL',
        discount: 'FREE DESSERT',
        description: 'Celebrate your special day with a complimentary dessert on eligible bookings.',
        couponCode: null,
        startDate: null,
        endDate: null,
        active: true,
        offerType: 'FREEBIE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'off-4',
        title: 'FAMILY FEAST',
        discount: '₹200 OFF',
        description: 'Get ₹200 off on orders above ₹1,499.',
        couponCode: 'FAMILY200',
        startDate: null,
        endDate: null,
        active: true,
        offerType: 'FIXED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    writeJsonAtomic(FILES.offers, defaultOffers);
  }

  // 3. Admin User Seed
  const currentAdmins = readJsonFile<AdminUserModel[]>(FILES.admins, []);
  if (currentAdmins.length === 0) {
    const defaultEmail = process.env.ADMIN_EMAIL || 'admin@arracafe.com';
    const defaultPass = process.env.ADMIN_PASSWORD || 'admin123';
    const { hash, salt } = hashPassword(defaultPass);
    const defaultAdmin: AdminUserModel = {
      id: 'admin-1',
      email: defaultEmail,
      passwordHash: hash,
      salt: salt,
      name: 'Arra Cafe Admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    writeJsonAtomic(FILES.admins, [defaultAdmin]);
  }

  // 4. Ensure Bookings Table exists (starts empty for real customer bookings only)
  readJsonFile<BookingModel[]>(FILES.bookings, []);

  // 5. Ensure Payments Table exists (starts empty for real payment transactions only)
  readJsonFile<PaymentModel[]>(FILES.payments, []);
}

// Run DB initialization once on startup
initDatabase();

// ==========================================
// REPOSITORY FUNCTIONS
// ==========================================

// --- MENU ITEMS ---

export function getMenuItems(filter?: { category?: string; availableOnly?: boolean; search?: string }): MenuItemModel[] {
  let items = readJsonFile<MenuItemModel[]>(FILES.menu, []);
  if (filter?.category && filter.category !== 'ALL') {
    const norm = filter.category.trim().toLowerCase();
    items = items.filter(i => i.category.trim().toLowerCase() === norm);
  }
  if (filter?.availableOnly) {
    items = items.filter(i => i.available === true);
  }
  if (filter?.search) {
    const q = filter.search.trim().toLowerCase();
    items = items.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
  }
  return items;
}

export function getMenuItemById(id: string): MenuItemModel | null {
  const items = readJsonFile<MenuItemModel[]>(FILES.menu, []);
  return items.find(i => i.id === id) || null;
}

export function createMenuItem(data: Omit<MenuItemModel, 'createdAt' | 'updatedAt'>): MenuItemModel {
  const items = readJsonFile<MenuItemModel[]>(FILES.menu, []);
  const newItem: MenuItemModel = {
    ...data,
    id: data.id || `custom-${Date.now()}`,
    available: data.available !== undefined ? data.available : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  items.unshift(newItem);
  writeJsonAtomic(FILES.menu, items);
  return newItem;
}

export function updateMenuItem(id: string, data: Partial<MenuItemModel>): MenuItemModel | null {
  const items = readJsonFile<MenuItemModel[]>(FILES.menu, []);
  const index = items.findIndex(i => i.id === id);
  if (index === -1) return null;

  items[index] = {
    ...items[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  writeJsonAtomic(FILES.menu, items);
  return items[index];
}

export function deleteMenuItem(id: string): boolean {
  const items = readJsonFile<MenuItemModel[]>(FILES.menu, []);
  const filtered = items.filter(i => i.id !== id);
  if (filtered.length === items.length) return false;
  writeJsonAtomic(FILES.menu, filtered);
  return true;
}

export function toggleMenuItemAvailability(id: string): MenuItemModel | null {
  const items = readJsonFile<MenuItemModel[]>(FILES.menu, []);
  const index = items.findIndex(i => i.id === id);
  if (index === -1) return null;

  items[index].available = !items[index].available;
  items[index].updatedAt = new Date().toISOString();
  writeJsonAtomic(FILES.menu, items);
  return items[index];
}

// --- OFFERS ---

export function getOffers(activeOnly: boolean = false): OfferModel[] {
  let offers = readJsonFile<OfferModel[]>(FILES.offers, []);
  if (activeOnly) {
    offers = offers.filter(o => o.active);
  }
  return offers;
}

export function getOfferById(id: string): OfferModel | null {
  const offers = readJsonFile<OfferModel[]>(FILES.offers, []);
  return offers.find(o => o.id === id) || null;
}

export function createOffer(data: Omit<OfferModel, 'id' | 'createdAt' | 'updatedAt'>): OfferModel {
  const offers = readJsonFile<OfferModel[]>(FILES.offers, []);
  const newOffer: OfferModel = {
    ...data,
    id: `off-${Date.now()}`,
    active: data.active !== undefined ? data.active : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  offers.unshift(newOffer);
  writeJsonAtomic(FILES.offers, offers);
  return newOffer;
}

export function updateOffer(id: string, data: Partial<OfferModel>): OfferModel | null {
  const offers = readJsonFile<OfferModel[]>(FILES.offers, []);
  const index = offers.findIndex(o => o.id === id);
  if (index === -1) return null;

  offers[index] = {
    ...offers[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  writeJsonAtomic(FILES.offers, offers);
  return offers[index];
}

export function deleteOffer(id: string): boolean {
  const offers = readJsonFile<OfferModel[]>(FILES.offers, []);
  const filtered = offers.filter(o => o.id !== id);
  if (filtered.length === offers.length) return false;
  writeJsonAtomic(FILES.offers, filtered);
  return true;
}

export function toggleOfferActive(id: string): OfferModel | null {
  const offers = readJsonFile<OfferModel[]>(FILES.offers, []);
  const index = offers.findIndex(o => o.id === id);
  if (index === -1) return null;

  offers[index].active = !offers[index].active;
  offers[index].updatedAt = new Date().toISOString();
  writeJsonAtomic(FILES.offers, offers);
  return offers[index];
}

// --- BOOKINGS ---

export function getBookings(): BookingModel[] {
  const bookings = readJsonFile<BookingModel[]>(FILES.bookings, []);
  return bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getBookingById(id: string): BookingModel | null {
  const bookings = readJsonFile<BookingModel[]>(FILES.bookings, []);
  return bookings.find(b => b.id === id || b.bookingId === id) || null;
}

export function createBooking(data: Omit<BookingModel, 'id' | 'createdAt' | 'updatedAt'>): BookingModel {
  const bookings = readJsonFile<BookingModel[]>(FILES.bookings, []);
  const newBooking: BookingModel = {
    ...data,
    id: `bkg-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  bookings.unshift(newBooking);
  writeJsonAtomic(FILES.bookings, bookings);

  // If advance is paid, record payment
  if (newBooking.paymentStatus === 'Paid' && newBooking.advanceAmount > 0) {
    createPayment({
      paymentReference: `PAY-${newBooking.bookingId}-${Date.now().toString().slice(-4)}`,
      bookingId: newBooking.bookingId,
      customerName: newBooking.customer.name,
      customerPhone: newBooking.customer.phone,
      type: 'Booking Advance',
      amount: newBooking.advanceAmount,
      status: 'Paid',
      method: 'Online',
    });
  }

  return newBooking;
}

export function updateBookingStatus(
  id: string,
  bookingStatus: BookingModel['bookingStatus'],
  paymentStatus?: BookingModel['paymentStatus']
): BookingModel | null {
  const bookings = readJsonFile<BookingModel[]>(FILES.bookings, []);
  const index = bookings.findIndex(b => b.id === id || b.bookingId === id);
  if (index === -1) return null;

  bookings[index].bookingStatus = bookingStatus;
  if (paymentStatus) {
    bookings[index].paymentStatus = paymentStatus;
  }
  bookings[index].updatedAt = new Date().toISOString();
  writeJsonAtomic(FILES.bookings, bookings);
  return bookings[index];
}

// --- PAYMENTS ---

export function getPayments(): PaymentModel[] {
  const payments = readJsonFile<PaymentModel[]>(FILES.payments, []);
  return payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createPayment(data: Omit<PaymentModel, 'id' | 'createdAt'>): PaymentModel {
  const payments = readJsonFile<PaymentModel[]>(FILES.payments, []);
  const newPayment: PaymentModel = {
    ...data,
    id: `pay-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  payments.unshift(newPayment);
  writeJsonAtomic(FILES.payments, payments);
  return newPayment;
}

// --- ADMIN USERS ---

export function getAdminByEmail(email: string): AdminUserModel | null {
  const admins = readJsonFile<AdminUserModel[]>(FILES.admins, []);
  return admins.find(a => a.email.toLowerCase() === email.trim().toLowerCase()) || null;
}

// --- DASHBOARD SUMMARY STATS ---

export function getDashboardStats() {
  const todayStr = new Date().toISOString().split('T')[0];
  const bookings = readJsonFile<BookingModel[]>(FILES.bookings, []);
  const menu = readJsonFile<MenuItemModel[]>(FILES.menu, []);
  const offers = readJsonFile<OfferModel[]>(FILES.offers, []);
  const payments = readJsonFile<PaymentModel[]>(FILES.payments, []);

  const todayBookings = bookings.filter(b => b.date === todayStr);
  const pendingBookings = bookings.filter(b => b.bookingStatus === 'Payment Pending');
  const activeMenuItems = menu.filter(m => m.available);
  const inactiveMenuItems = menu.filter(m => !m.available);
  const activeOffers = offers.filter(o => o.active);
  const totalRevenue = payments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    todayBookingsCount: todayBookings.length,
    pendingBookingsCount: pendingBookings.length,
    activeMenuItemsCount: activeMenuItems.length,
    inactiveMenuItemsCount: inactiveMenuItems.length,
    activeOffersCount: activeOffers.length,
    totalRevenue,
    recentPayments: payments.slice(0, 5),
    recentBookings: bookings.slice(0, 5),
  };
}
