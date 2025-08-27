import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  loginInputSchema,
  createUserInputSchema,
  createLocationInputSchema,
  updateLocationInputSchema,
  createCategoryInputSchema,
  updateCategoryInputSchema,
  createSupplierInputSchema,
  updateSupplierInputSchema,
  createInventoryItemInputSchema,
  updateInventoryItemInputSchema,
  batchImportInputSchema,
  createPurchaseInputSchema,
  updatePurchaseInputSchema,
  createLocationHistoryInputSchema,
  updateLocationHistoryInputSchema,
  inventoryReportFilterSchema,
  purchaseReportFilterSchema,
  locationHistoryReportFilterSchema,
} from './schema';

// Import handlers
import { login, logout, validateSession, initializeDefaultUser } from './handlers/auth';
import { getUsers, getUserById, createUser, deleteUser } from './handlers/users';
import { getDashboardStats } from './handlers/dashboard';
import {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
} from './handlers/locations';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from './handlers/categories';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from './handlers/suppliers';
import {
  getInventoryItems,
  getInventoryItemById,
  getInventoryItemByCode,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  batchImportItems,
} from './handlers/inventory';
import {
  getPurchases,
  getPurchaseById,
  getPurchasesByItem,
  getPurchasesBySupplier,
  createPurchase,
  updatePurchase,
  deletePurchase,
} from './handlers/purchases';
import {
  getLocationHistory,
  getLocationHistoryById,
  getLocationHistoryByItem,
  createLocationHistory,
  updateLocationHistory,
  deleteLocationHistory,
} from './handlers/location_history';
import {
  generateInventoryReport,
  generatePurchaseReport,
  generateLocationHistoryReport,
  generateInventorySummary,
  generatePurchaseSummary,
} from './handlers/reports';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication
  auth: router({
    login: publicProcedure
      .input(loginInputSchema)
      .mutation(({ input }) => login(input)),
    logout: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(({ input }) => logout(input.sessionId)),
    validateSession: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(({ input }) => validateSession(input.sessionId)),
  }),

  // User Management
  users: router({
    getAll: publicProcedure.query(() => getUsers()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getUserById(input.id)),
    create: publicProcedure
      .input(createUserInputSchema)
      .mutation(({ input }) => createUser(input)),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteUser(input.id)),
  }),

  // Dashboard
  dashboard: router({
    getStats: publicProcedure.query(() => getDashboardStats()),
  }),

  // Locations
  locations: router({
    getAll: publicProcedure.query(() => getLocations()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getLocationById(input.id)),
    create: publicProcedure
      .input(createLocationInputSchema)
      .mutation(({ input }) => createLocation(input)),
    update: publicProcedure
      .input(updateLocationInputSchema)
      .mutation(({ input }) => updateLocation(input)),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteLocation(input.id)),
  }),

  // Categories
  categories: router({
    getAll: publicProcedure.query(() => getCategories()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getCategoryById(input.id)),
    create: publicProcedure
      .input(createCategoryInputSchema)
      .mutation(({ input }) => createCategory(input)),
    update: publicProcedure
      .input(updateCategoryInputSchema)
      .mutation(({ input }) => updateCategory(input)),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteCategory(input.id)),
  }),

  // Suppliers
  suppliers: router({
    getAll: publicProcedure.query(() => getSuppliers()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getSupplierById(input.id)),
    create: publicProcedure
      .input(createSupplierInputSchema)
      .mutation(({ input }) => createSupplier(input)),
    update: publicProcedure
      .input(updateSupplierInputSchema)
      .mutation(({ input }) => updateSupplier(input)),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteSupplier(input.id)),
  }),

  // Inventory Items
  inventory: router({
    getAll: publicProcedure.query(() => getInventoryItems()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getInventoryItemById(input.id)),
    getByCode: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(({ input }) => getInventoryItemByCode(input.code)),
    create: publicProcedure
      .input(createInventoryItemInputSchema)
      .mutation(({ input }) => createInventoryItem(input)),
    update: publicProcedure
      .input(updateInventoryItemInputSchema)
      .mutation(({ input }) => updateInventoryItem(input)),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteInventoryItem(input.id)),
    batchImport: publicProcedure
      .input(batchImportInputSchema)
      .mutation(({ input }) => batchImportItems(input)),
  }),

  // Purchases
  purchases: router({
    getAll: publicProcedure.query(() => getPurchases()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getPurchaseById(input.id)),
    getByItem: publicProcedure
      .input(z.object({ itemId: z.number() }))
      .query(({ input }) => getPurchasesByItem(input.itemId)),
    getBySupplier: publicProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(({ input }) => getPurchasesBySupplier(input.supplierId)),
    create: publicProcedure
      .input(createPurchaseInputSchema)
      .mutation(({ input }) => createPurchase(input)),
    update: publicProcedure
      .input(updatePurchaseInputSchema)
      .mutation(({ input }) => updatePurchase(input)),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deletePurchase(input.id)),
  }),

  // Location History
  locationHistory: router({
    getAll: publicProcedure.query(() => getLocationHistory()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getLocationHistoryById(input.id)),
    getByItem: publicProcedure
      .input(z.object({ itemId: z.number() }))
      .query(({ input }) => getLocationHistoryByItem(input.itemId)),
    create: publicProcedure
      .input(createLocationHistoryInputSchema)
      .mutation(({ input }) => createLocationHistory(input)),
    update: publicProcedure
      .input(updateLocationHistoryInputSchema)
      .mutation(({ input }) => updateLocationHistory(input)),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteLocationHistory(input.id)),
  }),

  // Reports
  reports: router({
    inventory: publicProcedure
      .input(inventoryReportFilterSchema)
      .query(({ input }) => generateInventoryReport(input)),
    inventorySummary: publicProcedure
      .input(inventoryReportFilterSchema)
      .query(({ input }) => generateInventorySummary(input)),
    purchases: publicProcedure
      .input(purchaseReportFilterSchema)
      .query(({ input }) => generatePurchaseReport(input)),
    purchasesSummary: publicProcedure
      .input(purchaseReportFilterSchema)
      .query(({ input }) => generatePurchaseSummary(input)),
    locationHistory: publicProcedure
      .input(locationHistoryReportFilterSchema)
      .query(({ input }) => generateLocationHistoryReport(input)),
  }),
});

export type AppRouter = typeof appRouter;

async function start() {
  // Initialize default admin user on startup
  await initializeDefaultUser();
  
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();