import { z } from 'zod';

// Enums
export const itemConditionEnum = z.enum(['excellent', 'good', 'fair', 'poor', 'damaged']);
export const transferStatusEnum = z.enum(['pending', 'in_transit', 'completed', 'cancelled']);
export const userRoleEnum = z.enum(['admin', 'user']);

// Users schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  role: userRoleEnum,
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const loginInputSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const loginResponseSchema = z.object({
  success: z.boolean(),
  sessionId: z.string().optional(),
  user: userSchema.optional(),
  message: z.string().optional()
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const createUserInputSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: userRoleEnum.default('user')
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const sessionSchema = z.object({
  id: z.string(),
  user_id: z.number(),
  expires_at: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Session = z.infer<typeof sessionSchema>;

// Locations schema
export const locationSchema = z.object({
  id: z.number(),
  name: z.string(),
  branch_code: z.string(),
  address: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Location = z.infer<typeof locationSchema>;

export const createLocationInputSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  branch_code: z.string().min(1, "Branch code is required"),
  address: z.string().nullable()
});

export type CreateLocationInput = z.infer<typeof createLocationInputSchema>;

export const updateLocationInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  branch_code: z.string().min(1).optional(),
  address: z.string().nullable().optional()
});

export type UpdateLocationInput = z.infer<typeof updateLocationInputSchema>;

// Categories schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

export const createCategoryInputSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().nullable()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional()
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

// Suppliers schema
export const supplierSchema = z.object({
  id: z.number(),
  name: z.string(),
  contact_person: z.string().nullable(),
  phone_number: z.string().nullable(),
  address: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Supplier = z.infer<typeof supplierSchema>;

export const createSupplierInputSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  contact_person: z.string().nullable(),
  phone_number: z.string().nullable(),
  address: z.string().nullable()
});

export type CreateSupplierInput = z.infer<typeof createSupplierInputSchema>;

export const updateSupplierInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  contact_person: z.string().nullable().optional(),
  phone_number: z.string().nullable().optional(),
  address: z.string().nullable().optional()
});

export type UpdateSupplierInput = z.infer<typeof updateSupplierInputSchema>;

// Inventory Items schema
export const inventoryItemSchema = z.object({
  id: z.number(),
  item_code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category_id: z.number(),
  location_id: z.number(),
  condition: itemConditionEnum,
  quantity: z.number().int(),
  purchase_price: z.number(),
  purchase_date: z.coerce.date(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type InventoryItem = z.infer<typeof inventoryItemSchema>;

export const createInventoryItemInputSchema = z.object({
  item_code: z.string().min(1, "Item code is required"),
  name: z.string().min(1, "Item name is required"),
  description: z.string().nullable(),
  category_id: z.number(),
  location_id: z.number(),
  condition: itemConditionEnum,
  quantity: z.number().int().nonnegative(),
  purchase_price: z.number().nonnegative(),
  purchase_date: z.coerce.date()
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemInputSchema>;

export const updateInventoryItemInputSchema = z.object({
  id: z.number(),
  item_code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category_id: z.number().optional(),
  location_id: z.number().optional(),
  condition: itemConditionEnum.optional(),
  quantity: z.number().int().nonnegative().optional(),
  purchase_price: z.number().nonnegative().optional(),
  purchase_date: z.coerce.date().optional()
});

export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemInputSchema>;

// Batch import schema
export const batchImportItemSchema = z.object({
  item_code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  category_name: z.string().min(1),
  location_name: z.string().min(1),
  condition: itemConditionEnum,
  quantity: z.number().int().nonnegative(),
  purchase_price: z.number().nonnegative(),
  purchase_date: z.coerce.date()
});

export type BatchImportItem = z.infer<typeof batchImportItemSchema>;

export const batchImportInputSchema = z.object({
  items: z.array(batchImportItemSchema)
});

export type BatchImportInput = z.infer<typeof batchImportInputSchema>;

// Purchases schema
export const purchaseSchema = z.object({
  id: z.number(),
  item_id: z.number(),
  supplier_id: z.number(),
  quantity: z.number().int(),
  unit_price: z.number(),
  total_price: z.number(),
  purchase_date: z.coerce.date(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Purchase = z.infer<typeof purchaseSchema>;

export const createPurchaseInputSchema = z.object({
  item_id: z.number(),
  supplier_id: z.number(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  purchase_date: z.coerce.date(),
  notes: z.string().nullable()
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseInputSchema>;

export const updatePurchaseInputSchema = z.object({
  id: z.number(),
  item_id: z.number().optional(),
  supplier_id: z.number().optional(),
  quantity: z.number().int().positive().optional(),
  unit_price: z.number().positive().optional(),
  purchase_date: z.coerce.date().optional(),
  notes: z.string().nullable().optional()
});

export type UpdatePurchaseInput = z.infer<typeof updatePurchaseInputSchema>;

// Location History schema
export const locationHistorySchema = z.object({
  id: z.number(),
  item_id: z.number(),
  from_location_id: z.number().nullable(),
  to_location_id: z.number(),
  transfer_date: z.coerce.date(),
  transferred_by: z.string(),
  reason: z.string().nullable(),
  status: transferStatusEnum,
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type LocationHistory = z.infer<typeof locationHistorySchema>;

export const createLocationHistoryInputSchema = z.object({
  item_id: z.number(),
  from_location_id: z.number().nullable(),
  to_location_id: z.number(),
  transfer_date: z.coerce.date(),
  transferred_by: z.string().min(1, "Transferred by is required"),
  reason: z.string().nullable(),
  status: transferStatusEnum,
  notes: z.string().nullable()
});

export type CreateLocationHistoryInput = z.infer<typeof createLocationHistoryInputSchema>;

export const updateLocationHistoryInputSchema = z.object({
  id: z.number(),
  status: transferStatusEnum.optional(),
  notes: z.string().nullable().optional()
});

export type UpdateLocationHistoryInput = z.infer<typeof updateLocationHistoryInputSchema>;

// Dashboard Statistics schema
export const dashboardStatsSchema = z.object({
  total_items: z.number(),
  total_categories: z.number(),
  total_locations: z.number(),
  total_suppliers: z.number(),
  recent_purchases: z.number(),
  items_by_condition: z.record(z.string(), z.number()),
  items_by_location: z.record(z.string(), z.number()),
  recent_transfers: z.number()
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

// Reports schema
export const inventoryReportFilterSchema = z.object({
  category_id: z.number().optional(),
  location_id: z.number().optional(),
  condition: itemConditionEnum.optional(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional()
});

export type InventoryReportFilter = z.infer<typeof inventoryReportFilterSchema>;

export const purchaseReportFilterSchema = z.object({
  supplier_id: z.number().optional(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional()
});

export type PurchaseReportFilter = z.infer<typeof purchaseReportFilterSchema>;

export const locationHistoryReportFilterSchema = z.object({
  item_id: z.number().optional(),
  location_id: z.number().optional(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional(),
  status: transferStatusEnum.optional()
});

export type LocationHistoryReportFilter = z.infer<typeof locationHistoryReportFilterSchema>;