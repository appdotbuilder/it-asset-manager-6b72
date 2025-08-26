import { db } from '../db';
import { 
  inventoryItemsTable,
  purchasesTable,
  locationHistoryTable,
  categoriesTable,
  locationsTable,
  suppliersTable
} from '../db/schema';
import { 
  type InventoryItem, 
  type Purchase, 
  type LocationHistory,
  type InventoryReportFilter,
  type PurchaseReportFilter,
  type LocationHistoryReportFilter
} from '../schema';
import { eq, and, gte, lte, SQL } from 'drizzle-orm';

export async function generateInventoryReport(filter: InventoryReportFilter): Promise<InventoryItem[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter.category_id !== undefined) {
      conditions.push(eq(inventoryItemsTable.category_id, filter.category_id));
    }

    if (filter.location_id !== undefined) {
      conditions.push(eq(inventoryItemsTable.location_id, filter.location_id));
    }

    if (filter.condition !== undefined) {
      conditions.push(eq(inventoryItemsTable.condition, filter.condition));
    }

    if (filter.date_from !== undefined) {
      conditions.push(gte(inventoryItemsTable.purchase_date, filter.date_from));
    }

    if (filter.date_to !== undefined) {
      conditions.push(lte(inventoryItemsTable.purchase_date, filter.date_to));
    }

    // Build query with joins and conditional where clause
    const baseQuery = db.select({
      id: inventoryItemsTable.id,
      item_code: inventoryItemsTable.item_code,
      name: inventoryItemsTable.name,
      description: inventoryItemsTable.description,
      category_id: inventoryItemsTable.category_id,
      location_id: inventoryItemsTable.location_id,
      condition: inventoryItemsTable.condition,
      quantity: inventoryItemsTable.quantity,
      purchase_price: inventoryItemsTable.purchase_price,
      purchase_date: inventoryItemsTable.purchase_date,
      created_at: inventoryItemsTable.created_at,
      updated_at: inventoryItemsTable.updated_at
    })
    .from(inventoryItemsTable)
    .innerJoin(categoriesTable, eq(inventoryItemsTable.category_id, categoriesTable.id))
    .innerJoin(locationsTable, eq(inventoryItemsTable.location_id, locationsTable.id));

    const query = conditions.length > 0 
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    const results = await query.execute();

    // Convert numeric fields back to numbers
    return results.map(item => ({
      ...item,
      purchase_price: parseFloat(item.purchase_price)
    }));
  } catch (error) {
    console.error('Inventory report generation failed:', error);
    throw error;
  }
}

export async function generatePurchaseReport(filter: PurchaseReportFilter): Promise<Purchase[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter.supplier_id !== undefined) {
      conditions.push(eq(purchasesTable.supplier_id, filter.supplier_id));
    }

    if (filter.date_from !== undefined) {
      conditions.push(gte(purchasesTable.purchase_date, filter.date_from));
    }

    if (filter.date_to !== undefined) {
      conditions.push(lte(purchasesTable.purchase_date, filter.date_to));
    }

    // Build query with joins and conditional where clause
    const baseQuery = db.select({
      id: purchasesTable.id,
      item_id: purchasesTable.item_id,
      supplier_id: purchasesTable.supplier_id,
      quantity: purchasesTable.quantity,
      unit_price: purchasesTable.unit_price,
      total_price: purchasesTable.total_price,
      purchase_date: purchasesTable.purchase_date,
      notes: purchasesTable.notes,
      created_at: purchasesTable.created_at,
      updated_at: purchasesTable.updated_at
    })
    .from(purchasesTable)
    .innerJoin(inventoryItemsTable, eq(purchasesTable.item_id, inventoryItemsTable.id))
    .innerJoin(suppliersTable, eq(purchasesTable.supplier_id, suppliersTable.id));

    const query = conditions.length > 0 
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    const results = await query.execute();

    // Convert numeric fields back to numbers
    return results.map(purchase => ({
      ...purchase,
      unit_price: parseFloat(purchase.unit_price),
      total_price: parseFloat(purchase.total_price)
    }));
  } catch (error) {
    console.error('Purchase report generation failed:', error);
    throw error;
  }
}

export async function generateLocationHistoryReport(filter: LocationHistoryReportFilter): Promise<LocationHistory[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter.item_id !== undefined) {
      conditions.push(eq(locationHistoryTable.item_id, filter.item_id));
    }

    if (filter.location_id !== undefined) {
      conditions.push(eq(locationHistoryTable.to_location_id, filter.location_id));
    }

    if (filter.status !== undefined) {
      conditions.push(eq(locationHistoryTable.status, filter.status));
    }

    if (filter.date_from !== undefined) {
      conditions.push(gte(locationHistoryTable.transfer_date, filter.date_from));
    }

    if (filter.date_to !== undefined) {
      conditions.push(lte(locationHistoryTable.transfer_date, filter.date_to));
    }

    // Build query with joins and conditional where clause
    const baseQuery = db.select({
      id: locationHistoryTable.id,
      item_id: locationHistoryTable.item_id,
      from_location_id: locationHistoryTable.from_location_id,
      to_location_id: locationHistoryTable.to_location_id,
      transfer_date: locationHistoryTable.transfer_date,
      transferred_by: locationHistoryTable.transferred_by,
      reason: locationHistoryTable.reason,
      status: locationHistoryTable.status,
      notes: locationHistoryTable.notes,
      created_at: locationHistoryTable.created_at,
      updated_at: locationHistoryTable.updated_at
    })
    .from(locationHistoryTable)
    .innerJoin(inventoryItemsTable, eq(locationHistoryTable.item_id, inventoryItemsTable.id))
    .innerJoin(locationsTable, eq(locationHistoryTable.to_location_id, locationsTable.id));

    const query = conditions.length > 0 
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    const results = await query.execute();

    return results;
  } catch (error) {
    console.error('Location history report generation failed:', error);
    throw error;
  }
}

export async function generateInventorySummary(filter: InventoryReportFilter): Promise<{
  totalItems: number;
  totalValue: number;
  itemsByCategory: Record<string, number>;
  itemsByLocation: Record<string, number>;
  itemsByCondition: Record<string, number>;
}> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter.category_id !== undefined) {
      conditions.push(eq(inventoryItemsTable.category_id, filter.category_id));
    }

    if (filter.location_id !== undefined) {
      conditions.push(eq(inventoryItemsTable.location_id, filter.location_id));
    }

    if (filter.condition !== undefined) {
      conditions.push(eq(inventoryItemsTable.condition, filter.condition));
    }

    if (filter.date_from !== undefined) {
      conditions.push(gte(inventoryItemsTable.purchase_date, filter.date_from));
    }

    if (filter.date_to !== undefined) {
      conditions.push(lte(inventoryItemsTable.purchase_date, filter.date_to));
    }

    // Build query with joins and conditional where clause
    const baseQuery = db.select({
      id: inventoryItemsTable.id,
      quantity: inventoryItemsTable.quantity,
      purchase_price: inventoryItemsTable.purchase_price,
      condition: inventoryItemsTable.condition,
      category_name: categoriesTable.name,
      location_name: locationsTable.name
    })
    .from(inventoryItemsTable)
    .innerJoin(categoriesTable, eq(inventoryItemsTable.category_id, categoriesTable.id))
    .innerJoin(locationsTable, eq(inventoryItemsTable.location_id, locationsTable.id));

    const query = conditions.length > 0 
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    const results = await query.execute();

    // Calculate summary statistics
    let totalItems = 0;
    let totalValue = 0;
    const itemsByCategory: Record<string, number> = {};
    const itemsByLocation: Record<string, number> = {};
    const itemsByCondition: Record<string, number> = {};

    results.forEach(item => {
      const quantity = item.quantity;
      const price = parseFloat(item.purchase_price);
      const value = quantity * price;

      totalItems += quantity;
      totalValue += value;

      // Count by category
      itemsByCategory[item.category_name] = (itemsByCategory[item.category_name] || 0) + quantity;

      // Count by location
      itemsByLocation[item.location_name] = (itemsByLocation[item.location_name] || 0) + quantity;

      // Count by condition
      itemsByCondition[item.condition] = (itemsByCondition[item.condition] || 0) + quantity;
    });

    return {
      totalItems,
      totalValue,
      itemsByCategory,
      itemsByLocation,
      itemsByCondition
    };
  } catch (error) {
    console.error('Inventory summary generation failed:', error);
    throw error;
  }
}

export async function generatePurchaseSummary(filter: PurchaseReportFilter): Promise<{
  totalPurchases: number;
  totalAmount: number;
  purchasesBySupplier: Record<string, { count: number; amount: number }>;
  purchasesByMonth: Record<string, { count: number; amount: number }>;
}> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter.supplier_id !== undefined) {
      conditions.push(eq(purchasesTable.supplier_id, filter.supplier_id));
    }

    if (filter.date_from !== undefined) {
      conditions.push(gte(purchasesTable.purchase_date, filter.date_from));
    }

    if (filter.date_to !== undefined) {
      conditions.push(lte(purchasesTable.purchase_date, filter.date_to));
    }

    // Build query with joins and conditional where clause
    const baseQuery = db.select({
      id: purchasesTable.id,
      total_price: purchasesTable.total_price,
      purchase_date: purchasesTable.purchase_date,
      supplier_name: suppliersTable.name
    })
    .from(purchasesTable)
    .innerJoin(suppliersTable, eq(purchasesTable.supplier_id, suppliersTable.id));

    const query = conditions.length > 0 
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    const results = await query.execute();

    // Calculate summary statistics
    let totalPurchases = 0;
    let totalAmount = 0;
    const purchasesBySupplier: Record<string, { count: number; amount: number }> = {};
    const purchasesByMonth: Record<string, { count: number; amount: number }> = {};

    results.forEach(purchase => {
      const amount = parseFloat(purchase.total_price);
      totalPurchases += 1;
      totalAmount += amount;

      // Group by supplier
      if (!purchasesBySupplier[purchase.supplier_name]) {
        purchasesBySupplier[purchase.supplier_name] = { count: 0, amount: 0 };
      }
      purchasesBySupplier[purchase.supplier_name].count += 1;
      purchasesBySupplier[purchase.supplier_name].amount += amount;

      // Group by month (YYYY-MM format)
      const monthKey = purchase.purchase_date.toISOString().slice(0, 7);
      if (!purchasesByMonth[monthKey]) {
        purchasesByMonth[monthKey] = { count: 0, amount: 0 };
      }
      purchasesByMonth[monthKey].count += 1;
      purchasesByMonth[monthKey].amount += amount;
    });

    return {
      totalPurchases,
      totalAmount,
      purchasesBySupplier,
      purchasesByMonth
    };
  } catch (error) {
    console.error('Purchase summary generation failed:', error);
    throw error;
  }
}