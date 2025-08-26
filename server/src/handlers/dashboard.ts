import { db } from '../db';
import { 
  inventoryItemsTable, 
  categoriesTable, 
  locationsTable, 
  suppliersTable, 
  purchasesTable,
  locationHistoryTable 
} from '../db/schema';
import { type DashboardStats } from '../schema';
import { sql, count, eq, gte } from 'drizzle-orm';

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get current date for recent activity filtering (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Execute all queries in parallel for better performance
    const [
      totalItemsResult,
      totalCategoriesResult,
      totalLocationsResult,
      totalSuppliersResult,
      recentPurchasesResult,
      itemsByConditionResult,
      itemsByLocationResult,
      recentTransfersResult
    ] = await Promise.all([
      // Total items count
      db.select({ count: count() }).from(inventoryItemsTable).execute(),
      
      // Total categories count
      db.select({ count: count() }).from(categoriesTable).execute(),
      
      // Total locations count
      db.select({ count: count() }).from(locationsTable).execute(),
      
      // Total suppliers count
      db.select({ count: count() }).from(suppliersTable).execute(),
      
      // Recent purchases (last 30 days)
      db.select({ count: count() })
        .from(purchasesTable)
        .where(gte(purchasesTable.created_at, thirtyDaysAgo))
        .execute(),
      
      // Items by condition distribution
      db.select({
        condition: inventoryItemsTable.condition,
        count: count()
      })
        .from(inventoryItemsTable)
        .groupBy(inventoryItemsTable.condition)
        .execute(),
      
      // Items by location distribution (with location names)
      db.select({
        location_name: locationsTable.name,
        count: count(inventoryItemsTable.id)
      })
        .from(inventoryItemsTable)
        .innerJoin(locationsTable, eq(inventoryItemsTable.location_id, locationsTable.id))
        .groupBy(locationsTable.name)
        .execute(),
      
      // Recent transfers (last 30 days)
      db.select({ count: count() })
        .from(locationHistoryTable)
        .where(gte(locationHistoryTable.created_at, thirtyDaysAgo))
        .execute()
    ]);

    // Convert items by condition to record format
    const itemsByCondition: Record<string, number> = {};
    itemsByConditionResult.forEach(row => {
      itemsByCondition[row.condition] = row.count;
    });

    // Convert items by location to record format
    const itemsByLocation: Record<string, number> = {};
    itemsByLocationResult.forEach(row => {
      itemsByLocation[row.location_name] = row.count;
    });

    return {
      total_items: totalItemsResult[0]?.count || 0,
      total_categories: totalCategoriesResult[0]?.count || 0,
      total_locations: totalLocationsResult[0]?.count || 0,
      total_suppliers: totalSuppliersResult[0]?.count || 0,
      recent_purchases: recentPurchasesResult[0]?.count || 0,
      items_by_condition: itemsByCondition,
      items_by_location: itemsByLocation,
      recent_transfers: recentTransfersResult[0]?.count || 0
    };
  } catch (error) {
    console.error('Failed to fetch dashboard statistics:', error);
    throw error;
  }
}