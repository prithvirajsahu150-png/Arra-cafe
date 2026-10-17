import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { neon } from '@neondatabase/serverless';
import { Redis } from '@upstash/redis';
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

// ============================================================================
// PROVIDER SELECTION & CONNECTION INITIALIZATION
// ============================================================================

type DbProvider = 'postgres' | 'redis' | 'file';

function getProvider(): DbProvider {
  if (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  ) {
    return 'postgres';
  }

  const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (redisUrl && redisToken) {
    return 'redis';
  }

  return 'file';
}

// Global singletons to reuse across serverless function invocations
let cachedPostgresClient: ReturnType<typeof neon> | null = null;
let postgresInitPromise: Promise<void> | null = null;

function getPostgresClient() {
  if (cachedPostgresClient) return cachedPostgresClient;
  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    throw new Error('PostgreSQL connection string is not configured.');
  }

  cachedPostgresClient = neon(connectionString);
  return cachedPostgresClient;
}

let cachedRedisClient: Redis | null = null;
let redisInitPromise: Promise<void> | null = null;

function getRedisClient(): Redis {
  if (cachedRedisClient) return cachedRedisClient;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('Upstash / Vercel KV credentials not configured.');
  }

  cachedRedisClient = new Redis({ url, token });
  return cachedRedisClient;
}

// ============================================================================
// DEFAULT SEED DATA (Used by all providers on initial deployment)
// ============================================================================

function getDefaultMenuItems(): MenuItemModel[] {
  // If data/db/menu.json exists, read from it first to preserve any existing customizations
  const primaryDbFile = path.join(process.cwd(), 'data', 'db', 'menu.json');
  try {
    if (fs.existsSync(primaryDbFile)) {
      const raw = fs.readFileSync(primaryDbFile, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as MenuItemModel[];
      }
    }
  } catch {
    // fallback to MENU_ITEMS
  }

  const now = new Date().toISOString();
  return MENU_ITEMS.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    price: item.price,
    image: item.image ? item.image.replace(/^\/public/, '') : null,
    description: item.description || '',
    available: true,
    createdAt: now,
    updatedAt: now,
  }));
}

function getDefaultOffers(): OfferModel[] {
  const now = new Date().toISOString();
  return [
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
      createdAt: now,
      updatedAt: now,
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
      createdAt: now,
      updatedAt: now,
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
      createdAt: now,
      updatedAt: now,
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
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function getDefaultAdmin(): AdminUserModel {
  const defaultEmail = process.env.ADMIN_EMAIL || 'admin@arracafe.com';
  const defaultPass = process.env.ADMIN_PASSWORD || 'admin123';
  const { hash, salt } = hashPassword(defaultPass);
  const now = new Date().toISOString();
  return {
    id: 'admin-1',
    email: defaultEmail,
    passwordHash: hash,
    salt: salt,
    name: 'Arra Cafe Admin',
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================================================
// 1. POSTGRESQL PROVIDER IMPLEMENTATION (Vercel Postgres / Neon / Supabase)
// ============================================================================

async function ensurePostgresInitialized() {
  if (postgresInitPromise) return postgresInitPromise;

  postgresInitPromise = (async () => {
    const sql = getPostgresClient();

    // 1. Create tables
    await sql`
      CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price INTEGER NOT NULL,
        image TEXT,
        description TEXT,
        available BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TEXT,
        updated_at TEXT
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS offers (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        discount TEXT,
        coupon_code TEXT,
        start_date TEXT,
        end_date TEXT,
        active BOOLEAN DEFAULT TRUE,
        offer_type TEXT,
        created_at TEXT,
        updated_at TEXT
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        booking_id TEXT,
        purpose TEXT,
        custom_purpose TEXT,
        date TEXT,
        time TEXT,
        guests TEXT,
        customer JSONB,
        special_requirements JSONB,
        selected_items JSONB,
        total_amount INTEGER,
        advance_amount INTEGER,
        remaining_amount INTEGER,
        payment_status TEXT,
        booking_status TEXT,
        created_at TEXT,
        updated_at TEXT
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        payment_reference TEXT,
        booking_id TEXT,
        order_id TEXT,
        customer_name TEXT,
        customer_phone TEXT,
        type TEXT,
        amount INTEGER,
        status TEXT,
        method TEXT,
        created_at TEXT
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password_hash TEXT,
        salt TEXT,
        name TEXT,
        created_at TEXT,
        updated_at TEXT
      );
    `;

    // 2. Seed 129 Menu items if empty
    const countRes = (await sql`SELECT COUNT(*)::int as count FROM menu_items;`) as Array<{ count: number }>;
    const currentCount = countRes[0]?.count || 0;

    if (currentCount === 0) {
      console.log('[PostgreSQL Migration] Seeding 129 menu items...');
      const defaultItems = getDefaultMenuItems();
      for (const item of defaultItems) {
        await sql`
          INSERT INTO menu_items (id, name, category, price, image, description, available, created_at, updated_at)
          VALUES (${item.id}, ${item.name}, ${item.category}, ${item.price}, ${item.image}, ${item.description || ''}, ${item.available}, ${item.createdAt}, ${item.updatedAt})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
      console.log(`[PostgreSQL Migration] Successfully migrated ${defaultItems.length} menu items.`);
    }

    // 3. Seed Offers if empty
    const offersCountRes = (await sql`SELECT COUNT(*)::int as count FROM offers;`) as Array<{ count: number }>;
    if ((offersCountRes[0]?.count || 0) === 0) {
      const defaultOffers = getDefaultOffers();
      for (const off of defaultOffers) {
        await sql`
          INSERT INTO offers (id, title, description, discount, coupon_code, start_date, end_date, active, offer_type, created_at, updated_at)
          VALUES (${off.id}, ${off.title}, ${off.description}, ${off.discount}, ${off.couponCode}, ${off.startDate}, ${off.endDate}, ${off.active}, ${off.offerType}, ${off.createdAt}, ${off.updatedAt})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
    }

    // 4. Seed Default Admin if empty
    const adminCountRes = (await sql`SELECT COUNT(*)::int as count FROM admin_users;`) as Array<{ count: number }>;
    if ((adminCountRes[0]?.count || 0) === 0) {
      const defaultAdmin = getDefaultAdmin();
      await sql`
        INSERT INTO admin_users (id, email, password_hash, salt, name, created_at, updated_at)
        VALUES (${defaultAdmin.id}, ${defaultAdmin.email}, ${defaultAdmin.passwordHash}, ${defaultAdmin.salt}, ${defaultAdmin.name}, ${defaultAdmin.createdAt}, ${defaultAdmin.updatedAt})
        ON CONFLICT (id) DO NOTHING;
      `;
    }
  })();

  return postgresInitPromise;
}

function mapPostgresMenuItem(row: Record<string, unknown>): MenuItemModel {
  return {
    id: String(row.id),
    name: String(row.name),
    category: String(row.category),
    price: Number(row.price),
    image: row.image ? String(row.image) : null,
    description: row.description ? String(row.description) : '',
    available: Boolean(row.available),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function mapPostgresOffer(row: Record<string, unknown>): OfferModel {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description || ''),
    discount: String(row.discount || ''),
    couponCode: row.coupon_code ? String(row.coupon_code) : null,
    startDate: row.start_date ? String(row.start_date) : null,
    endDate: row.end_date ? String(row.end_date) : null,
    active: Boolean(row.active),
    offerType: String(row.offer_type || 'PERCENTAGE'),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

// ============================================================================
// 2. UPSTASH REDIS / VERCEL KV PROVIDER IMPLEMENTATION
// ============================================================================

const REDIS_KEYS = {
  menu: 'arra:menu_items',
  offers: 'arra:offers',
  bookings: 'arra:bookings',
  payments: 'arra:payments',
  admins: 'arra:admins',
};

async function ensureRedisInitialized() {
  if (redisInitPromise) return redisInitPromise;

  redisInitPromise = (async () => {
    const redis = getRedisClient();
    const existingMenu = await redis.get<MenuItemModel[]>(REDIS_KEYS.menu);
    if (!existingMenu || existingMenu.length === 0) {
      const defaultItems = getDefaultMenuItems();
      await redis.set(REDIS_KEYS.menu, defaultItems);
    }

    const existingOffers = await redis.get<OfferModel[]>(REDIS_KEYS.offers);
    if (!existingOffers || existingOffers.length === 0) {
      const defaultOffers = getDefaultOffers();
      await redis.set(REDIS_KEYS.offers, defaultOffers);
    }

    const existingAdmins = await redis.get<AdminUserModel[]>(REDIS_KEYS.admins);
    if (!existingAdmins || existingAdmins.length === 0) {
      const defaultAdmin = getDefaultAdmin();
      await redis.set(REDIS_KEYS.admins, [defaultAdmin]);
    }
  })();

  return redisInitPromise;
}

// ============================================================================
// 3. FILE SYSTEM PROVIDER (Local Dev + Serverless Fallback with /tmp auto-routing)
// ============================================================================

let resolvedDbDir: string | null = null;

function getDbDirectory(): string {
  if (resolvedDbDir) return resolvedDbDir;

  const defaultDir = path.join(process.cwd(), 'data', 'db');
  
  // Test if default directory is writable
  try {
    if (!fs.existsSync(defaultDir)) {
      fs.mkdirSync(defaultDir, { recursive: true });
    }
    const testFile = path.join(defaultDir, `.write_test_${Date.now()}`);
    fs.writeFileSync(testFile, 'ok', 'utf-8');
    fs.unlinkSync(testFile);
    resolvedDbDir = defaultDir;
    return resolvedDbDir;
  } catch {
    // Read-only filesystem (like AWS Lambda / Vercel Serverless without DB configured)
    const tmpDir = path.join(os.tmpdir(), 'arra_cafe_db');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    resolvedDbDir = tmpDir;
    return resolvedDbDir;
  }
}

function getFileForCollection(collectionName: string): string {
  const dir = getDbDirectory();
  return path.join(dir, `${collectionName}.json`);
}

function readFileJson<T>(collectionName: string, defaultFactory: () => T): T {
  const filePath = getFileForCollection(collectionName);
  const primaryDbFile = path.join(process.cwd(), 'data', 'db', `${collectionName}.json`);

  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    }

    // If reading from /tmp and primary repo file exists, copy from primary
    if (filePath !== primaryDbFile && fs.existsSync(primaryDbFile)) {
      const primaryRaw = fs.readFileSync(primaryDbFile, 'utf-8');
      const parsed = JSON.parse(primaryRaw) as T;
      writeFileJsonAtomic(collectionName, parsed);
      return parsed;
    }

    // Otherwise use default seed
    const def = defaultFactory();
    writeFileJsonAtomic(collectionName, def);
    return def;
  } catch (err) {
    console.error(`Error reading ${collectionName}:`, err);
    return defaultFactory();
  }
}

function writeFileJsonAtomic<T>(collectionName: string, data: T): void {
  const filePath = getFileForCollection(collectionName);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tempPath = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(2, 7)}.tmp`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`Error writing ${collectionName}:`, err);
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch {
      // ignore
    }
    throw err;
  }
}

// ============================================================================
// UNIFIED REPOSITORY EXPORTS
// All functions are async and dynamically route to PostgreSQL, Redis, or File.
// ============================================================================

// --- MENU ITEMS ---

export async function getMenuItems(filter?: {
  category?: string;
  availableOnly?: boolean;
  search?: string;
}): Promise<MenuItemModel[]> {
  const provider = getProvider();

  if (provider === 'postgres') {
    await ensurePostgresInitialized();
    const sql = getPostgresClient();
    const rows = (await sql`SELECT * FROM menu_items ORDER BY created_at ASC;`) as Array<Record<string, unknown>>;
    let items = rows.map(mapPostgresMenuItem);

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

  if (provider === 'redis') {
    await ensureRedisInitialized();
    const redis = getRedisClient();
    let items = (await redis.get<MenuItemModel[]>(REDIS_KEYS.menu)) || [];

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

  // File provider
  let items = readFileJson<MenuItemModel[]>('menu', getDefaultMenuItems);
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

export async function getMenuItemById(id: string): Promise<MenuItemModel | null> {
  const provider = getProvider();

  if (provider === 'postgres') {
    await ensurePostgresInitialized();
    const sql = getPostgresClient();
    const rows = (await sql`SELECT * FROM menu_items WHERE id = ${id} LIMIT 1;`) as Array<Record<string, unknown>>;
    if (rows.length === 0) return null;
    return mapPostgresMenuItem(rows[0]);
  }

  if (provider === 'redis') {
    await ensureRedisInitialized();
    const redis = getRedisClient();
    const items = (await redis.get<MenuItemModel[]>(REDIS_KEYS.menu)) || [];
    return items.find(i => i.id === id) || null;
  }

  const items = readFileJson<MenuItemModel[]>('menu', getDefaultMenuItems);
  return items.find(i => i.id === id) || null;
}

export async function createMenuItem(
  data: Omit<MenuItemModel, 'createdAt' | 'updatedAt'>
): Promise<MenuItemModel> {
  const now = new Date().toISOString();
  const newItem: MenuItemModel = {
    ...data,
    id: data.id || `custom-${Date.now()}`,
    available: data.available !== undefined ? data.available : true,
    createdAt: now,
    updatedAt: now,
  };

  const provider = getProvider();

  if (provider === 'postgres') {
    await ensurePostgresInitialized();
    const sql = getPostgresClient();
    await sql`
      INSERT INTO menu_items (id, name, category, price, image, description, available, created_at, updated_at)
      VALUES (${newItem.id}, ${newItem.name}, ${newItem.category}, ${newItem.price}, ${newItem.image}, ${newItem.description || ''}, ${newItem.available}, ${newItem.createdAt}, ${newItem.updatedAt});
    `;
    return newItem;
  }

  if (provider === 'redis') {
    await ensureRedisInitialized();
    const redis = getRedisClient();
    const items = (await redis.get<MenuItemModel[]>(REDIS_KEYS.menu)) || [];
    items.unshift(newItem);
    await redis.set(REDIS_KEYS.menu, items);
    return newItem;
  }

  const items = readFileJson<MenuItemModel[]>('menu', getDefaultMenuItems);
  items.unshift(newItem);
  writeFileJsonAtomic('menu', items);
  return newItem;
}

export async function updateMenuItem(
  id: string,
  data: Partial<MenuItemModel>
): Promise<MenuItemModel | null> {
  const now = new Date().toISOString();
  const provider = getProvider();

  if (provider === 'postgres') {
    await ensurePostgresInitialized();
    const sql = getPostgresClient();
    const existing = await getMenuItemById(id);
    if (!existing) return null;

    const merged = { ...existing, ...data, updatedAt: now };
    await sql`
      UPDATE menu_items
      SET name = ${merged.name},
          category = ${merged.category},
          price = ${merged.price},
          image = ${merged.image},
          description = ${merged.description || ''},
          available = ${merged.available},
          updated_at = ${now}
      WHERE id = ${id};
    `;
    return merged;
  }

  if (provider === 'redis') {
    await ensureRedisInitialized();
    const redis = getRedisClient();
    const items = (await redis.get<MenuItemModel[]>(REDIS_KEYS.menu)) || [];
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return null;

    items[index] = { ...items[index], ...data, updatedAt: now };
    await redis.set(REDIS_KEYS.menu, items);
    return items[index];
  }

  const items = readFileJson<MenuItemModel[]>('menu', getDefaultMenuItems);
  const index = items.findIndex(i => i.id === id);
  if (index === -1) return null;

  items[index] = { ...items[index], ...data, updatedAt: now };
  writeFileJsonAtomic('menu', items);
  return items[index];
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  const provider = getProvider();

  if (provider === 'postgres') {
    await ensurePostgresInitialized();
    const sql = getPostgresClient();
    const res = (await sql`DELETE FROM menu_items WHERE id = ${id} RETURNING id;`) as Array<{ id: string }>;
    return res.length > 0;
  }

  if (provider === 'redis') {
    await ensureRedisInitialized();
    const redis = getRedisClient();
    const items = (await redis.get<MenuItemModel[]>(REDIS_KEYS.menu)) || [];
    const filtered = items.filter(i => i.id !== id);
    if (filtered.length === items.length) return false;
    await redis.set(REDIS_KEYS.menu, filtered);
    return true;
  }

  const items = readFileJson<MenuItemModel[]>('menu', getDefaultMenuItems);
  const filtered = items.filter(i => i.id !== id);
  if (filtered.length === items.length) return false;
  writeFileJsonAtomic('menu', filtered);
  return true;
}

export async function toggleMenuItemAvailability(id: string): Promise<MenuItemModel | null> {
  const now = new Date().toISOString();
  const provider = getProvider();

  if (provider === 'postgres') {
    await ensurePostgresInitialized();
    const sql = getPostgresClient();
    const rows = (await sql`
      UPDATE menu_items
      SET available = NOT available,
          updated_at = ${now}
      WHERE id = ${id}
      RETURNING *;
    `) as Array<Record<string, unknown>>;

    if (rows.length === 0) return null;
    return mapPostgresMenuItem(rows[0]);
  }

  if (provider === 'redis') {
    await ensureRedisInitialized();
    const redis = getRedisClient();
    const items = (await redis.get<MenuItemModel[]>(REDIS_KEYS.menu)) || [];
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return null;

    items[index].available = !items[index].available;
    items[index].updatedAt = now;
    await redis.set(REDIS_KEYS.menu, items);
    return items[index];
  }

  const items = readFileJson<MenuItemModel[]>('menu', getDefaultMenuItems);
  const index = items.findIndex(i => i.id === id);
  if (index === -1) return null;

  items[index].available = !items[index].available;
  items[index].updatedAt = now;
  writeFileJsonAtomic('menu', items);
  return items[index];
}

// --- OFFERS ---

export async function getOffers(activeOnly: boolean = false): Promise<OfferModel[]> {
  const provider = getProvider();

  if (provider === 'postgres') {
    await ensurePostgresInitialized();
    const sql = getPostgresClient();
    const rows = (await sql`SELECT * FROM offers ORDER BY created_at ASC;`) as Array<Record<string, unknown>>;
    let offers = rows.map(mapPostgresOffer);
    if (activeOnly) offers = offers.filter(o => o.active);
    return offers;
  }

  if (provider === 'redis') {
    await ensureRedisInitialized();
    const redis = getRedisClient();
    let offers = (await redis.get<OfferModel[]>(REDIS_KEYS.offers)) || [];
    if (activeOnly) offers = offers.filter(o => o.active);
    return offers;
  }

  let offers = readFileJson<OfferModel[]>('offers', getDefaultOffers);
  if (activeOnly) offers = offers.filter(o => o.active);
  return offers;
}

export async function getOfferById(id: string): Promise<OfferModel | null> {
  const provider = getProvider();

  if (provider === 'postgres') {
    await ensurePostgresInitialized();
    const sql = getPostgresClient();
    const rows = (await sql`SELECT * FROM offers WHERE id = ${id} LIMIT 1;`) as Array<Record<string, unknown>>;
    if (rows.length === 0) return null;
    return mapPostgresOffer(rows[0]);
  }

  if (provider === 'redis') {
    await ensureRedisInitialized();
    const redis = getRedisClient();
    const offers = (await redis.get<OfferModel[]>(REDIS_KEYS.offers)) || [];
    return offers.find(o => o.id === id) || null;
  }

  const offers = readFileJson<OfferModel[]>('offers', getDefaultOffers);
  return offers.find(o => o.id === id) || null;
}

export async function createOffer(
  data: Omit<OfferModel, 'id' | 'createdAt' | 'updatedAt'>
): Promise<OfferModel> {
  const now = new Date().toISOString();
  const newOffer: OfferModel = {
    ...data,
    id: `off-${Date.now()}`,
    active: data.active !== undefined ? data.active : true,
    createdAt: now,
    updatedAt: now,
  };

  const provider = getProvider();

  if (provider === 'postgres') {
    await ensurePostgresInitialized();
    const sql = getPostgresClient();
    await sql`
      INSERT INTO offers (id, title, description, discount, coupon_code, start_date, end_date, active, offer_type, created_at, updated_at)
      VALUES (${newOffer.id}, ${newOffer.title}, ${newOffer.description}, ${newOffer.discount}, ${newOffer.couponCode}, ${newOffer.startDate}, ${newOffer.endDate}, ${newOffer.active}, ${newOffer.offerType}, ${newOffer.createdAt}, ${newOffer.updatedAt});
    `;
    return newOffer;
  }

  if (provider === 'redis') {
    await ensureRedisInitialized();
    const redis = getRedisClient();
    const offers = (await redis.get<OfferModel[]>(REDIS_KEYS.offers)) || [];
    offers.unshift(newOffer);
    await redis.set(REDIS_KEYS.offers, offers);
    return newOffer;
  }

  const offers = readFileJson<OfferModel[]>('offers', getDefaultOffers);
  offers.unshift(newOffer);
  writeFileJsonAtomic('offers', offers);
  return newOffer;
}

export async function updateOffer(
  id: string,
  data: Partial<OfferModel>
): Promise<OfferModel | null> {
  const now = new Date().toISOString();
  const provider = getProvider();

  if (provider === 'postgres') {
    await ensurePostgresInitialized();
    const sql = getPostgresClient();
    const existing = await getOfferById(id);
    if (!existing) return null;

    const merged = { ...existing, ...data, updatedAt: now };
    await sql`
      UPDATE offers
      SET title = ${merged.title},
          description = ${merged.description},
          discount = ${merged.discount},
          coupon_code = ${merged.couponCode},
          start_date = ${merged.startDate},
          end_date = ${merged.endDate},
          active = ${merged.active},
          offer_type = ${merged.offerType},
          updated_at = ${now}
      WHERE id = ${id};
    `;
    return merged;
  }

  if (provider === 'redis') {
    await ensureRedisInitialized();
    const redis = getRedisClient();
    const offers = (await redis.get<OfferModel[]>(REDIS_KEYS.offers)) || [];
    const index = offers.findIndex(o => o.id === id);
    if (index === -1) return null;

    offers[index] = { ...offers[index], ...data, updatedAt: now };
    await redis.set(REDIS_KEYS.offers, offers);
    return offers[index];
  }

  const offers = readFileJson<OfferModel[]>('offers', getDefaultOffers);
  const index = offers.findIndex(o => o.id === id);
  if (index === -1) return null;

  offers[index] = { ...offers[index], ...data, updatedAt: now };
  writeFileJsonAtomic('offers', offers);
  return offers[index];
}

export async function deleteOffer(id: string): Promise<boolean> {
  const provider = getProvider();

  if (provider === 'postgres') {
    await ensurePostgresInitialized();
    const sql = getPostgresClient();
    const res = (await sql`DELETE FROM offers WHERE id = ${id} RETURNING id;`) as Array<{ id: string }>;
    return res.length > 0;
  }

  if (provider === 'redis') {
    await ensureRedisInitialized();
    const redis = getRedisClient();
    const offers = (await redis.get<OfferModel[]>(REDIS_KEYS.offers)) || [];
    const filtered = offers.filter(o => o.id !== id);
    if (filtered.length === offers.length) return false;
    await redis.set(REDIS_KEYS.offers, filtered);
    return true;
  }

  const offers = readFileJson<OfferModel[]>('offers', getDefaultOffers);
  const filtered = offers.filter(o => o.id !== id);
  if (filtered.length === offers.length) return false;
  writeFileJsonAtomic('offers', filtered);
  return true;
}

export async function toggleOfferActive(id: string): Promise<OfferModel | null> {
  const now = new Date().toISOString();
  const provider = getProvider();

  if (provider === 'postgres') {
    await ensurePostgresInitialized();
    const sql = getPostgresClient();
    const rows = (await sql`
      UPDATE offers
      SET active = NOT active,
          updated_at = ${now}
      WHERE id = ${id}
      RETURNING *;
    `) as Array<Record<string, unknown>>;
    if (rows.length === 0) return null;
    return mapPostgresOffer(rows[0]);
  }

  if (provider === 'redis') {
    await ensureRedisInitialized();
    const redis = getRedisClient();
    const offers = (await redis.get<OfferModel[]>(REDIS_KEYS.offers)) || [];
    const index = offers.findIndex(o => o.id === id);
    if (index === -1) return null;

    offers[index].active = !offers[index].active;
    offers[index].updatedAt = now;
    await redis.set(REDIS_KEYS.offers, offers);
    return offers[index];
  }

  const offers = readFileJson<OfferModel[]>('offers', getDefaultOffers);
  const index = offers.findIndex(o => o.id === id);
  if (index === -1) return null;

  offers[index].active = !offers[index].active;
  offers[index].updatedAt = now;
  writeFileJsonAtomic('offers', offers);
  return offers[index];
}

// --- BOOKINGS ---

export async function getBookings(): Promise<BookingModel[]> {
  const provider = getProvider();

  if (provider === 'postgres') {
    await ensurePostgresInitialized();
    const sql = getPostgresClient();
    const rows = (await sql`SELECT * FROM bookings ORDER BY created_at DESC;`) as Array<Record<string, unknown>>;
    return rows.map(r => ({
      id: String(r.id),
      bookingId: String(r.booking_id),
      purpose: String(r.purpose || ''),
      customPurpose: r.custom_purpose ? String(r.custom_purpose) : undefined,
      date: String(r.date || ''),
      time: String(r.time || ''),
      guests: String(r.guests || ''),
      customer: (r.customer as BookingModel['customer']) || { name: '', phone: '' },
      specialRequirements: (r.special_requirements as BookingModel['specialRequirements']) || {},
      selectedItems: (r.selected_items as BookingModel['selectedItems']) || [],
      totalAmount: Number(r.total_amount || 0),
      advanceAmount: Number(r.advance_amount || 0),
      remainingAmount: Number(r.remaining_amount || 0),
      paymentStatus: (r.payment_status as BookingModel['paymentStatus']) || 'Pending',
      bookingStatus: (r.booking_status as BookingModel['bookingStatus']) || 'Payment Pending',
      createdAt: String(r.created_at || ''),
      updatedAt: String(r.updated_at || ''),
    }));
  }

  if (provider === 'redis') {
    await ensureRedisInitialized();
    const redis = getRedisClient();
    const bookings = (await redis.get<BookingModel[]>(REDIS_KEYS.bookings)) || [];
    return bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const bookings = readFileJson<BookingModel[]>('bookings', () => []);
  return bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getBookingById(id: string): Promise<BookingModel | null> {
  const bookings = await getBookings();
  return bookings.find(b => b.id === id || b.bookingId === id) || null;
}

export async function createBooking(
  data: Omit<BookingModel, 'id' | 'createdAt' | 'updatedAt'>
): Promise<BookingModel> {
  const now = new Date().toISOString();
  const newBooking: BookingModel = {
    ...data,
    id: `bkg-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };

  const provider = getProvider();

  if (provider === 'postgres') {
    await ensurePostgresInitialized();
    const sql = getPostgresClient();
    await sql`
      INSERT INTO bookings (
        id, booking_id, purpose, custom_purpose, date, time, guests,
        customer, special_requirements, selected_items, total_amount,
        advance_amount, remaining_amount, payment_status, booking_status,
        created_at, updated_at
      )
      VALUES (
        ${newBooking.id}, ${newBooking.bookingId}, ${newBooking.purpose}, ${newBooking.customPurpose || null},
        ${newBooking.date}, ${newBooking.time}, ${newBooking.guests},
        ${JSON.stringify(newBooking.customer)}, ${JSON.stringify(newBooking.specialRequirements || {})},
        ${JSON.stringify(newBooking.selectedItems || [])}, ${newBooking.totalAmount},
        ${newBooking.advanceAmount}, ${newBooking.remainingAmount}, ${newBooking.paymentStatus},
        ${newBooking.bookingStatus}, ${newBooking.createdAt}, ${newBooking.updatedAt}
      );
    `;
  } else if (provider === 'redis') {
    await ensureRedisInitialized();
    const redis = getRedisClient();
    const bookings = (await redis.get<BookingModel[]>(REDIS_KEYS.bookings)) || [];
    bookings.unshift(newBooking);
    await redis.set(REDIS_KEYS.bookings, bookings);
  } else {
    const bookings = readFileJson<BookingModel[]>('bookings', () => []);
    bookings.unshift(newBooking);
    writeFileJsonAtomic('bookings', bookings);
  }

  // If advance is paid, record payment
  if (newBooking.paymentStatus === 'Paid' && newBooking.advanceAmount > 0) {
    await createPayment({
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

export async function updateBookingStatus(
  id: string,
  bookingStatus: BookingModel['bookingStatus'],
  paymentStatus?: BookingModel['paymentStatus']
): Promise<BookingModel | null> {
  const now = new Date().toISOString();
  const provider = getProvider();

  if (provider === 'postgres') {
    await ensurePostgresInitialized();
    const sql = getPostgresClient();
    const existing = await getBookingById(id);
    if (!existing) return null;

    const newPaymentStatus = paymentStatus || existing.paymentStatus;
    await sql`
      UPDATE bookings
      SET booking_status = ${bookingStatus},
          payment_status = ${newPaymentStatus},
          updated_at = ${now}
      WHERE id = ${existing.id};
    `;
    return { ...existing, bookingStatus, paymentStatus: newPaymentStatus, updatedAt: now };
  }

  if (provider === 'redis') {
    await ensureRedisInitialized();
    const redis = getRedisClient();
    const bookings = (await redis.get<BookingModel[]>(REDIS_KEYS.bookings)) || [];
    const index = bookings.findIndex(b => b.id === id || b.bookingId === id);
    if (index === -1) return null;

    bookings[index].bookingStatus = bookingStatus;
    if (paymentStatus) bookings[index].paymentStatus = paymentStatus;
    bookings[index].updatedAt = now;
    await redis.set(REDIS_KEYS.bookings, bookings);
    return bookings[index];
  }

  const bookings = readFileJson<BookingModel[]>('bookings', () => []);
  const index = bookings.findIndex(b => b.id === id || b.bookingId === id);
  if (index === -1) return null;

  bookings[index].bookingStatus = bookingStatus;
  if (paymentStatus) bookings[index].paymentStatus = paymentStatus;
  bookings[index].updatedAt = now;
  writeFileJsonAtomic('bookings', bookings);
  return bookings[index];
}

// --- PAYMENTS ---

export async function getPayments(): Promise<PaymentModel[]> {
  const provider = getProvider();

  if (provider === 'postgres') {
    await ensurePostgresInitialized();
    const sql = getPostgresClient();
    const rows = (await sql`SELECT * FROM payments ORDER BY created_at DESC;`) as Array<Record<string, unknown>>;
    return rows.map(r => ({
      id: String(r.id),
      paymentReference: String(r.payment_reference),
      bookingId: r.booking_id ? String(r.booking_id) : null,
      orderId: r.order_id ? String(r.order_id) : null,
      customerName: String(r.customer_name || ''),
      customerPhone: String(r.customer_phone || ''),
      type: (r.type as PaymentModel['type']) || 'Food Delivery',
      amount: Number(r.amount || 0),
      status: (r.status as PaymentModel['status']) || 'Pending',
      method: r.method ? String(r.method) : undefined,
      createdAt: String(r.created_at || ''),
    }));
  }

  if (provider === 'redis') {
    await ensureRedisInitialized();
    const redis = getRedisClient();
    const payments = (await redis.get<PaymentModel[]>(REDIS_KEYS.payments)) || [];
    return payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const payments = readFileJson<PaymentModel[]>('payments', () => []);
  return payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createPayment(
  data: Omit<PaymentModel, 'id' | 'createdAt'>
): Promise<PaymentModel> {
  const now = new Date().toISOString();
  const newPayment: PaymentModel = {
    ...data,
    id: `pay-${Date.now()}`,
    createdAt: now,
  };

  const provider = getProvider();

  if (provider === 'postgres') {
    await ensurePostgresInitialized();
    const sql = getPostgresClient();
    await sql`
      INSERT INTO payments (id, payment_reference, booking_id, order_id, customer_name, customer_phone, type, amount, status, method, created_at)
      VALUES (${newPayment.id}, ${newPayment.paymentReference}, ${newPayment.bookingId || null}, ${newPayment.orderId || null}, ${newPayment.customerName}, ${newPayment.customerPhone}, ${newPayment.type}, ${newPayment.amount}, ${newPayment.status}, ${newPayment.method || null}, ${newPayment.createdAt});
    `;
    return newPayment;
  }

  if (provider === 'redis') {
    await ensureRedisInitialized();
    const redis = getRedisClient();
    const payments = (await redis.get<PaymentModel[]>(REDIS_KEYS.payments)) || [];
    payments.unshift(newPayment);
    await redis.set(REDIS_KEYS.payments, payments);
    return newPayment;
  }

  const payments = readFileJson<PaymentModel[]>('payments', () => []);
  payments.unshift(newPayment);
  writeFileJsonAtomic('payments', payments);
  return newPayment;
}

// --- ADMIN USERS ---

export async function getAdminByEmail(email: string): Promise<AdminUserModel | null> {
  const provider = getProvider();

  if (provider === 'postgres') {
    await ensurePostgresInitialized();
    const sql = getPostgresClient();
    const rows = (await sql`
      SELECT * FROM admin_users
      WHERE LOWER(email) = LOWER(${email.trim()})
      LIMIT 1;
    `) as Array<Record<string, unknown>>;

    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: String(r.id),
      email: String(r.email),
      passwordHash: String(r.password_hash),
      salt: String(r.salt),
      name: String(r.name),
      createdAt: String(r.created_at || ''),
      updatedAt: String(r.updated_at || ''),
    };
  }

  if (provider === 'redis') {
    await ensureRedisInitialized();
    const redis = getRedisClient();
    const admins = (await redis.get<AdminUserModel[]>(REDIS_KEYS.admins)) || [];
    return admins.find(a => a.email.toLowerCase() === email.trim().toLowerCase()) || null;
  }

  const admins = readFileJson<AdminUserModel[]>('admins', () => [getDefaultAdmin()]);
  return admins.find(a => a.email.toLowerCase() === email.trim().toLowerCase()) || null;
}

// --- DASHBOARD SUMMARY STATS ---

export async function getDashboardStats() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [bookings, menu, offers, payments] = await Promise.all([
    getBookings(),
    getMenuItems(),
    getOffers(),
    getPayments(),
  ]);

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
