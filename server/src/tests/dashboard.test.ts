import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  categoriesTable, 
  locationsTable, 
  suppliersTable, 
  inventoryItemsTable,
  purchasesTable,
  locationHistoryTable 
} from '../db/schema';
import { getDashboardStats } from '../handlers/dashboard';

describe('getDashboardStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty dashboard stats when no data exists', async () => {
    const stats = await getDashboardStats();

    expect(stats.total_items).toEqual(0);
    expect(stats.total_categories).toEqual(0);
    expect(stats.total_locations).toEqual(0);
    expect(stats.total_suppliers).toEqual(0);
    expect(stats.recent_purchases).toEqual(0);
    expect(stats.items_by_condition).toEqual({});
    expect(stats.items_by_location).toEqual({});
    expect(stats.recent_transfers).toEqual(0);
  });

  it('should return correct total counts for all entities', async () => {
    // Create test categories
    const categoriesResult = await db.insert(categoriesTable)
      .values([
        { name: 'Electronics', description: 'Electronic devices' },
        { name: 'Furniture', description: 'Office furniture' }
      ])
      .returning()
      .execute();

    // Create test locations
    const locationsResult = await db.insert(locationsTable)
      .values([
        { name: 'Main Office', branch_code: 'MO01', address: '123 Main St' },
        { name: 'Warehouse', branch_code: 'WH01', address: '456 Storage Ave' }
      ])
      .returning()
      .execute();

    // Create test suppliers
    await db.insert(suppliersTable)
      .values([
        { name: 'Tech Supply Co', contact_person: 'John Doe', phone_number: '555-1234' },
        { name: 'Office Depot', contact_person: 'Jane Smith', phone_number: '555-5678' },
        { name: 'Equipment Plus', contact_person: 'Bob Wilson', phone_number: '555-9999' }
      ])
      .execute();

    // Create test inventory items
    await db.insert(inventoryItemsTable)
      .values([
        {
          item_code: 'LAPTOP001',
          name: 'Dell Laptop',
          description: 'Business laptop',
          category_id: categoriesResult[0].id,
          location_id: locationsResult[0].id,
          condition: 'excellent',
          quantity: 5,
          purchase_price: '999.99',
          purchase_date: new Date('2024-01-15')
        },
        {
          item_code: 'DESK001',
          name: 'Office Desk',
          description: 'Wooden desk',
          category_id: categoriesResult[1].id,
          location_id: locationsResult[1].id,
          condition: 'good',
          quantity: 3,
          purchase_price: '299.99',
          purchase_date: new Date('2024-02-01')
        }
      ])
      .execute();

    const stats = await getDashboardStats();

    expect(stats.total_items).toEqual(2);
    expect(stats.total_categories).toEqual(2);
    expect(stats.total_locations).toEqual(2);
    expect(stats.total_suppliers).toEqual(3);
  });

  it('should return correct items distribution by condition', async () => {
    // Create prerequisite data
    const categoriesResult = await db.insert(categoriesTable)
      .values([{ name: 'Test Category', description: null }])
      .returning()
      .execute();

    const locationsResult = await db.insert(locationsTable)
      .values([{ name: 'Test Location', branch_code: 'TL01', address: null }])
      .returning()
      .execute();

    // Create items with different conditions
    await db.insert(inventoryItemsTable)
      .values([
        {
          item_code: 'ITEM001',
          name: 'Item 1',
          description: null,
          category_id: categoriesResult[0].id,
          location_id: locationsResult[0].id,
          condition: 'excellent',
          quantity: 1,
          purchase_price: '100.00',
          purchase_date: new Date()
        },
        {
          item_code: 'ITEM002',
          name: 'Item 2',
          description: null,
          category_id: categoriesResult[0].id,
          location_id: locationsResult[0].id,
          condition: 'excellent',
          quantity: 1,
          purchase_price: '150.00',
          purchase_date: new Date()
        },
        {
          item_code: 'ITEM003',
          name: 'Item 3',
          description: null,
          category_id: categoriesResult[0].id,
          location_id: locationsResult[0].id,
          condition: 'good',
          quantity: 1,
          purchase_price: '75.00',
          purchase_date: new Date()
        },
        {
          item_code: 'ITEM004',
          name: 'Item 4',
          description: null,
          category_id: categoriesResult[0].id,
          location_id: locationsResult[0].id,
          condition: 'fair',
          quantity: 1,
          purchase_price: '50.00',
          purchase_date: new Date()
        }
      ])
      .execute();

    const stats = await getDashboardStats();

    expect(stats.items_by_condition['excellent']).toEqual(2);
    expect(stats.items_by_condition['good']).toEqual(1);
    expect(stats.items_by_condition['fair']).toEqual(1);
    expect(stats.items_by_condition['poor']).toBeUndefined();
    expect(stats.items_by_condition['damaged']).toBeUndefined();
  });

  it('should return correct items distribution by location', async () => {
    // Create test categories
    const categoriesResult = await db.insert(categoriesTable)
      .values([{ name: 'Test Category', description: null }])
      .returning()
      .execute();

    // Create test locations
    const locationsResult = await db.insert(locationsTable)
      .values([
        { name: 'Office A', branch_code: 'OFA', address: null },
        { name: 'Office B', branch_code: 'OFB', address: null },
        { name: 'Warehouse C', branch_code: 'WHC', address: null }
      ])
      .returning()
      .execute();

    // Create items distributed across locations
    await db.insert(inventoryItemsTable)
      .values([
        {
          item_code: 'ITEM001',
          name: 'Item 1',
          description: null,
          category_id: categoriesResult[0].id,
          location_id: locationsResult[0].id, // Office A
          condition: 'excellent',
          quantity: 1,
          purchase_price: '100.00',
          purchase_date: new Date()
        },
        {
          item_code: 'ITEM002',
          name: 'Item 2',
          description: null,
          category_id: categoriesResult[0].id,
          location_id: locationsResult[0].id, // Office A
          condition: 'good',
          quantity: 1,
          purchase_price: '150.00',
          purchase_date: new Date()
        },
        {
          item_code: 'ITEM003',
          name: 'Item 3',
          description: null,
          category_id: categoriesResult[0].id,
          location_id: locationsResult[1].id, // Office B
          condition: 'excellent',
          quantity: 1,
          purchase_price: '75.00',
          purchase_date: new Date()
        }
      ])
      .execute();

    const stats = await getDashboardStats();

    expect(stats.items_by_location['Office A']).toEqual(2);
    expect(stats.items_by_location['Office B']).toEqual(1);
    expect(stats.items_by_location['Warehouse C']).toBeUndefined();
  });

  it('should return correct recent activity counts (last 30 days)', async () => {
    // Create prerequisite data
    const categoriesResult = await db.insert(categoriesTable)
      .values([{ name: 'Test Category', description: null }])
      .returning()
      .execute();

    const locationsResult = await db.insert(locationsTable)
      .values([
        { name: 'Location A', branch_code: 'LA', address: null },
        { name: 'Location B', branch_code: 'LB', address: null }
      ])
      .returning()
      .execute();

    const suppliersResult = await db.insert(suppliersTable)
      .values([{ name: 'Test Supplier', contact_person: null, phone_number: null, address: null }])
      .returning()
      .execute();

    const itemsResult = await db.insert(inventoryItemsTable)
      .values([{
        item_code: 'ITEM001',
        name: 'Test Item',
        description: null,
        category_id: categoriesResult[0].id,
        location_id: locationsResult[0].id,
        condition: 'excellent',
        quantity: 10,
        purchase_price: '100.00',
        purchase_date: new Date()
      }])
      .returning()
      .execute();

    // Create recent purchases (within last 30 days)
    const recentDate = new Date();
    await db.insert(purchasesTable)
      .values([
        {
          item_id: itemsResult[0].id,
          supplier_id: suppliersResult[0].id,
          quantity: 2,
          unit_price: '100.00',
          total_price: '200.00',
          purchase_date: recentDate,
          notes: null,
          created_at: recentDate
        },
        {
          item_id: itemsResult[0].id,
          supplier_id: suppliersResult[0].id,
          quantity: 3,
          unit_price: '95.00',
          total_price: '285.00',
          purchase_date: recentDate,
          notes: null,
          created_at: recentDate
        }
      ])
      .execute();

    // Create recent location transfers (within last 30 days)
    await db.insert(locationHistoryTable)
      .values([
        {
          item_id: itemsResult[0].id,
          from_location_id: locationsResult[0].id,
          to_location_id: locationsResult[1].id,
          transfer_date: recentDate,
          transferred_by: 'Test User',
          reason: 'Relocation',
          status: 'completed',
          notes: null,
          created_at: recentDate
        }
      ])
      .execute();

    // Create old purchases (over 30 days ago) - should not be counted
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 45);
    await db.insert(purchasesTable)
      .values([{
        item_id: itemsResult[0].id,
        supplier_id: suppliersResult[0].id,
        quantity: 1,
        unit_price: '100.00',
        total_price: '100.00',
        purchase_date: oldDate,
        notes: null,
        created_at: oldDate
      }])
      .execute();

    const stats = await getDashboardStats();

    expect(stats.recent_purchases).toEqual(2);
    expect(stats.recent_transfers).toEqual(1);
  });

  it('should handle database with mixed old and recent data correctly', async () => {
    // Create prerequisite data
    const categoriesResult = await db.insert(categoriesTable)
      .values([{ name: 'Test Category', description: null }])
      .returning()
      .execute();

    const locationsResult = await db.insert(locationsTable)
      .values([{ name: 'Test Location', branch_code: 'TL01', address: null }])
      .returning()
      .execute();

    const suppliersResult = await db.insert(suppliersTable)
      .values([{ name: 'Test Supplier', contact_person: null, phone_number: null, address: null }])
      .returning()
      .execute();

    const itemsResult = await db.insert(inventoryItemsTable)
      .values([{
        item_code: 'ITEM001',
        name: 'Test Item',
        description: null,
        category_id: categoriesResult[0].id,
        location_id: locationsResult[0].id,
        condition: 'excellent',
        quantity: 10,
        purchase_price: '100.00',
        purchase_date: new Date()
      }])
      .returning()
      .execute();

    // Mix of recent and old data
    const recentDate = new Date();
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 45);

    await Promise.all([
      // Recent purchases
      db.insert(purchasesTable)
        .values([{
          item_id: itemsResult[0].id,
          supplier_id: suppliersResult[0].id,
          quantity: 1,
          unit_price: '100.00',
          total_price: '100.00',
          purchase_date: recentDate,
          notes: null,
          created_at: recentDate
        }])
        .execute(),

      // Old purchases
      db.insert(purchasesTable)
        .values([{
          item_id: itemsResult[0].id,
          supplier_id: suppliersResult[0].id,
          quantity: 1,
          unit_price: '100.00',
          total_price: '100.00',
          purchase_date: oldDate,
          notes: null,
          created_at: oldDate
        }])
        .execute()
    ]);

    const stats = await getDashboardStats();

    expect(stats.total_items).toEqual(1);
    expect(stats.total_categories).toEqual(1);
    expect(stats.total_locations).toEqual(1);
    expect(stats.total_suppliers).toEqual(1);
    expect(stats.recent_purchases).toEqual(1); // Only recent purchases
  });
});