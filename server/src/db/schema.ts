import { serial, text, pgTable, timestamp, numeric, integer, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const itemConditionEnum = pgEnum('item_condition', ['excellent', 'good', 'fair', 'poor', 'damaged']);
export const transferStatusEnum = pgEnum('transfer_status', ['pending', 'in_transit', 'completed', 'cancelled']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Sessions table
export const sessionsTable = pgTable('sessions', {
  id: text('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Locations table
export const locationsTable = pgTable('locations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  branch_code: text('branch_code').notNull(),
  address: text('address'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Categories table
export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Suppliers table
export const suppliersTable = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  contact_person: text('contact_person'),
  phone_number: text('phone_number'),
  address: text('address'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Inventory Items table
export const inventoryItemsTable = pgTable('inventory_items', {
  id: serial('id').primaryKey(),
  item_code: text('item_code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  category_id: integer('category_id').references(() => categoriesTable.id).notNull(),
  location_id: integer('location_id').references(() => locationsTable.id).notNull(),
  condition: itemConditionEnum('condition').notNull(),
  quantity: integer('quantity').notNull(),
  purchase_price: numeric('purchase_price', { precision: 12, scale: 2 }).notNull(),
  purchase_date: timestamp('purchase_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Purchases table
export const purchasesTable = pgTable('purchases', {
  id: serial('id').primaryKey(),
  item_id: integer('item_id').references(() => inventoryItemsTable.id).notNull(),
  supplier_id: integer('supplier_id').references(() => suppliersTable.id).notNull(),
  quantity: integer('quantity').notNull(),
  unit_price: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  total_price: numeric('total_price', { precision: 12, scale: 2 }).notNull(),
  purchase_date: timestamp('purchase_date').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Location History table
export const locationHistoryTable = pgTable('location_history', {
  id: serial('id').primaryKey(),
  item_id: integer('item_id').references(() => inventoryItemsTable.id).notNull(),
  from_location_id: integer('from_location_id').references(() => locationsTable.id),
  to_location_id: integer('to_location_id').references(() => locationsTable.id).notNull(),
  transfer_date: timestamp('transfer_date').notNull(),
  transferred_by: text('transferred_by').notNull(),
  reason: text('reason'),
  status: transferStatusEnum('status').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  sessions: many(sessionsTable),
}));

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionsTable.user_id],
    references: [usersTable.id],
  }),
}));

export const locationsRelations = relations(locationsTable, ({ many }) => ({
  inventoryItems: many(inventoryItemsTable),
  historyFrom: many(locationHistoryTable, { relationName: 'fromLocation' }),
  historyTo: many(locationHistoryTable, { relationName: 'toLocation' }),
}));

export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  inventoryItems: many(inventoryItemsTable),
}));

export const suppliersRelations = relations(suppliersTable, ({ many }) => ({
  purchases: many(purchasesTable),
}));

export const inventoryItemsRelations = relations(inventoryItemsTable, ({ one, many }) => ({
  category: one(categoriesTable, {
    fields: [inventoryItemsTable.category_id],
    references: [categoriesTable.id],
  }),
  location: one(locationsTable, {
    fields: [inventoryItemsTable.location_id],
    references: [locationsTable.id],
  }),
  purchases: many(purchasesTable),
  locationHistory: many(locationHistoryTable),
}));

export const purchasesRelations = relations(purchasesTable, ({ one }) => ({
  item: one(inventoryItemsTable, {
    fields: [purchasesTable.item_id],
    references: [inventoryItemsTable.id],
  }),
  supplier: one(suppliersTable, {
    fields: [purchasesTable.supplier_id],
    references: [suppliersTable.id],
  }),
}));

export const locationHistoryRelations = relations(locationHistoryTable, ({ one }) => ({
  item: one(inventoryItemsTable, {
    fields: [locationHistoryTable.item_id],
    references: [inventoryItemsTable.id],
  }),
  fromLocation: one(locationsTable, {
    fields: [locationHistoryTable.from_location_id],
    references: [locationsTable.id],
    relationName: 'fromLocation',
  }),
  toLocation: one(locationsTable, {
    fields: [locationHistoryTable.to_location_id],
    references: [locationsTable.id],
    relationName: 'toLocation',
  }),
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  sessions: sessionsTable,
  locations: locationsTable,
  categories: categoriesTable,
  suppliers: suppliersTable,
  inventoryItems: inventoryItemsTable,
  purchases: purchasesTable,
  locationHistory: locationHistoryTable,
};

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Session = typeof sessionsTable.$inferSelect;
export type NewSession = typeof sessionsTable.$inferInsert;

export type Location = typeof locationsTable.$inferSelect;
export type NewLocation = typeof locationsTable.$inferInsert;

export type Category = typeof categoriesTable.$inferSelect;
export type NewCategory = typeof categoriesTable.$inferInsert;

export type Supplier = typeof suppliersTable.$inferSelect;
export type NewSupplier = typeof suppliersTable.$inferInsert;

export type InventoryItem = typeof inventoryItemsTable.$inferSelect;
export type NewInventoryItem = typeof inventoryItemsTable.$inferInsert;

export type Purchase = typeof purchasesTable.$inferSelect;
export type NewPurchase = typeof purchasesTable.$inferInsert;

export type LocationHistory = typeof locationHistoryTable.$inferSelect;
export type NewLocationHistory = typeof locationHistoryTable.$inferInsert;