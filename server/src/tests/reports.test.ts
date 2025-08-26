import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  locationsTable,
  categoriesTable,
  suppliersTable,
  inventoryItemsTable,
  purchasesTable,
  locationHistoryTable
} from '../db/schema';
import { 
  generateInventoryReport,
  generatePurchaseReport,
  generateLocationHistoryReport,
  generateInventorySummary,
  generatePurchaseSummary
} from '../handlers/reports';
import { 
  type InventoryReportFilter,
  type PurchaseReportFilter,
  type LocationHistoryReportFilter
} from '../schema';

describe('Reports Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup
  let testLocationId: number;
  let testCategoryId: number;
  let testSupplierId: number;
  let testItemId: number;

  const setupTestData = async () => {
    // Create test location
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Test Warehouse',
        branch_code: 'TW01',
        address: '123 Test St'
      })
      .returning()
      .execute();
    testLocationId = locationResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Test category for reports'
      })
      .returning()
      .execute();
    testCategoryId = categoryResult[0].id;

    // Create test supplier
    const supplierResult = await db.insert(suppliersTable)
      .values({
        name: 'Test Supplier',
        contact_person: 'John Doe',
        phone_number: '123-456-7890',
        address: '456 Supplier Ave'
      })
      .returning()
      .execute();
    testSupplierId = supplierResult[0].id;

    // Create test inventory item
    const itemResult = await db.insert(inventoryItemsTable)
      .values({
        item_code: 'TEST-001',
        name: 'Test Item',
        description: 'Test item for reports',
        category_id: testCategoryId,
        location_id: testLocationId,
        condition: 'excellent',
        quantity: 10,
        purchase_price: '100.50',
        purchase_date: new Date('2024-01-15')
      })
      .returning()
      .execute();
    testItemId = itemResult[0].id;

    // Create test purchase
    await db.insert(purchasesTable)
      .values({
        item_id: testItemId,
        supplier_id: testSupplierId,
        quantity: 5,
        unit_price: '100.50',
        total_price: '502.50',
        purchase_date: new Date('2024-01-15'),
        notes: 'Test purchase'
      })
      .execute();

    // Create test location history
    await db.insert(locationHistoryTable)
      .values({
        item_id: testItemId,
        from_location_id: null,
        to_location_id: testLocationId,
        transfer_date: new Date('2024-01-16'),
        transferred_by: 'Test User',
        reason: 'Initial placement',
        status: 'completed',
        notes: 'Test transfer'
      })
      .execute();
  };

  describe('generateInventoryReport', () => {
    beforeEach(setupTestData);

    it('should generate inventory report without filters', async () => {
      const filter: InventoryReportFilter = {};
      const result = await generateInventoryReport(filter);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Item');
      expect(result[0].item_code).toBe('TEST-001');
      expect(result[0].condition).toBe('excellent');
      expect(result[0].quantity).toBe(10);
      expect(typeof result[0].purchase_price).toBe('number');
      expect(result[0].purchase_price).toBe(100.5);
    });

    it('should filter by category_id', async () => {
      const filter: InventoryReportFilter = {
        category_id: testCategoryId
      };
      const result = await generateInventoryReport(filter);

      expect(result).toHaveLength(1);
      expect(result[0].category_id).toBe(testCategoryId);
    });

    it('should filter by location_id', async () => {
      const filter: InventoryReportFilter = {
        location_id: testLocationId
      };
      const result = await generateInventoryReport(filter);

      expect(result).toHaveLength(1);
      expect(result[0].location_id).toBe(testLocationId);
    });

    it('should filter by condition', async () => {
      const filter: InventoryReportFilter = {
        condition: 'excellent'
      };
      const result = await generateInventoryReport(filter);

      expect(result).toHaveLength(1);
      expect(result[0].condition).toBe('excellent');
    });

    it('should filter by date range', async () => {
      const filter: InventoryReportFilter = {
        date_from: new Date('2024-01-01'),
        date_to: new Date('2024-01-31')
      };
      const result = await generateInventoryReport(filter);

      expect(result).toHaveLength(1);
      expect(result[0].purchase_date).toBeInstanceOf(Date);
    });

    it('should return empty array when no items match filters', async () => {
      const filter: InventoryReportFilter = {
        condition: 'damaged'
      };
      const result = await generateInventoryReport(filter);

      expect(result).toHaveLength(0);
    });
  });

  describe('generatePurchaseReport', () => {
    beforeEach(setupTestData);

    it('should generate purchase report without filters', async () => {
      const filter: PurchaseReportFilter = {};
      const result = await generatePurchaseReport(filter);

      expect(result).toHaveLength(1);
      expect(result[0].item_id).toBe(testItemId);
      expect(result[0].supplier_id).toBe(testSupplierId);
      expect(result[0].quantity).toBe(5);
      expect(typeof result[0].unit_price).toBe('number');
      expect(result[0].unit_price).toBe(100.5);
      expect(typeof result[0].total_price).toBe('number');
      expect(result[0].total_price).toBe(502.5);
    });

    it('should filter by supplier_id', async () => {
      const filter: PurchaseReportFilter = {
        supplier_id: testSupplierId
      };
      const result = await generatePurchaseReport(filter);

      expect(result).toHaveLength(1);
      expect(result[0].supplier_id).toBe(testSupplierId);
    });

    it('should filter by date range', async () => {
      const filter: PurchaseReportFilter = {
        date_from: new Date('2024-01-01'),
        date_to: new Date('2024-01-31')
      };
      const result = await generatePurchaseReport(filter);

      expect(result).toHaveLength(1);
      expect(result[0].purchase_date).toBeInstanceOf(Date);
    });

    it('should return empty array when no purchases match filters', async () => {
      const filter: PurchaseReportFilter = {
        date_from: new Date('2024-02-01'),
        date_to: new Date('2024-02-28')
      };
      const result = await generatePurchaseReport(filter);

      expect(result).toHaveLength(0);
    });
  });

  describe('generateLocationHistoryReport', () => {
    beforeEach(setupTestData);

    it('should generate location history report without filters', async () => {
      const filter: LocationHistoryReportFilter = {};
      const result = await generateLocationHistoryReport(filter);

      expect(result).toHaveLength(1);
      expect(result[0].item_id).toBe(testItemId);
      expect(result[0].to_location_id).toBe(testLocationId);
      expect(result[0].status).toBe('completed');
      expect(result[0].transferred_by).toBe('Test User');
    });

    it('should filter by item_id', async () => {
      const filter: LocationHistoryReportFilter = {
        item_id: testItemId
      };
      const result = await generateLocationHistoryReport(filter);

      expect(result).toHaveLength(1);
      expect(result[0].item_id).toBe(testItemId);
    });

    it('should filter by location_id', async () => {
      const filter: LocationHistoryReportFilter = {
        location_id: testLocationId
      };
      const result = await generateLocationHistoryReport(filter);

      expect(result).toHaveLength(1);
      expect(result[0].to_location_id).toBe(testLocationId);
    });

    it('should filter by status', async () => {
      const filter: LocationHistoryReportFilter = {
        status: 'completed'
      };
      const result = await generateLocationHistoryReport(filter);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('completed');
    });

    it('should filter by date range', async () => {
      const filter: LocationHistoryReportFilter = {
        date_from: new Date('2024-01-01'),
        date_to: new Date('2024-01-31')
      };
      const result = await generateLocationHistoryReport(filter);

      expect(result).toHaveLength(1);
      expect(result[0].transfer_date).toBeInstanceOf(Date);
    });

    it('should return empty array when no history matches filters', async () => {
      const filter: LocationHistoryReportFilter = {
        status: 'cancelled'
      };
      const result = await generateLocationHistoryReport(filter);

      expect(result).toHaveLength(0);
    });
  });

  describe('generateInventorySummary', () => {
    beforeEach(setupTestData);

    it('should generate inventory summary without filters', async () => {
      const filter: InventoryReportFilter = {};
      const result = await generateInventorySummary(filter);

      expect(result.totalItems).toBe(10);
      expect(result.totalValue).toBe(1005); // 10 * 100.5
      expect(result.itemsByCategory['Test Category']).toBe(10);
      expect(result.itemsByLocation['Test Warehouse']).toBe(10);
      expect(result.itemsByCondition['excellent']).toBe(10);
    });

    it('should generate summary with category filter', async () => {
      const filter: InventoryReportFilter = {
        category_id: testCategoryId
      };
      const result = await generateInventorySummary(filter);

      expect(result.totalItems).toBe(10);
      expect(Object.keys(result.itemsByCategory)).toHaveLength(1);
      expect(result.itemsByCategory['Test Category']).toBe(10);
    });

    it('should generate empty summary when no items match', async () => {
      const filter: InventoryReportFilter = {
        condition: 'damaged'
      };
      const result = await generateInventorySummary(filter);

      expect(result.totalItems).toBe(0);
      expect(result.totalValue).toBe(0);
      expect(Object.keys(result.itemsByCategory)).toHaveLength(0);
    });
  });

  describe('generatePurchaseSummary', () => {
    beforeEach(setupTestData);

    it('should generate purchase summary without filters', async () => {
      const filter: PurchaseReportFilter = {};
      const result = await generatePurchaseSummary(filter);

      expect(result.totalPurchases).toBe(1);
      expect(result.totalAmount).toBe(502.5);
      expect(result.purchasesBySupplier['Test Supplier'].count).toBe(1);
      expect(result.purchasesBySupplier['Test Supplier'].amount).toBe(502.5);
      expect(result.purchasesByMonth['2024-01'].count).toBe(1);
      expect(result.purchasesByMonth['2024-01'].amount).toBe(502.5);
    });

    it('should generate summary with supplier filter', async () => {
      const filter: PurchaseReportFilter = {
        supplier_id: testSupplierId
      };
      const result = await generatePurchaseSummary(filter);

      expect(result.totalPurchases).toBe(1);
      expect(Object.keys(result.purchasesBySupplier)).toHaveLength(1);
      expect(result.purchasesBySupplier['Test Supplier'].count).toBe(1);
    });

    it('should generate empty summary when no purchases match', async () => {
      const filter: PurchaseReportFilter = {
        date_from: new Date('2024-02-01'),
        date_to: new Date('2024-02-28')
      };
      const result = await generatePurchaseSummary(filter);

      expect(result.totalPurchases).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(Object.keys(result.purchasesBySupplier)).toHaveLength(0);
      expect(Object.keys(result.purchasesByMonth)).toHaveLength(0);
    });
  });

  describe('Complex filtering scenarios', () => {
    beforeEach(async () => {
      await setupTestData();

      // Create additional test data for complex scenarios
      const location2Result = await db.insert(locationsTable)
        .values({
          name: 'Warehouse 2',
          branch_code: 'TW02',
          address: '789 Second St'
        })
        .returning()
        .execute();

      const category2Result = await db.insert(categoriesTable)
        .values({
          name: 'Electronics',
          description: 'Electronic items'
        })
        .returning()
        .execute();

      await db.insert(inventoryItemsTable)
        .values({
          item_code: 'ELEC-001',
          name: 'Laptop',
          description: 'Test laptop',
          category_id: category2Result[0].id,
          location_id: location2Result[0].id,
          condition: 'good',
          quantity: 5,
          purchase_price: '1200.00',
          purchase_date: new Date('2024-02-15')
        })
        .execute();
    });

    it('should handle multiple filters for inventory report', async () => {
      const filter: InventoryReportFilter = {
        condition: 'excellent',
        date_from: new Date('2024-01-01'),
        date_to: new Date('2024-01-31')
      };
      const result = await generateInventoryReport(filter);

      expect(result).toHaveLength(1);
      expect(result[0].condition).toBe('excellent');
      expect(result[0].name).toBe('Test Item');
    });

    it('should generate comprehensive inventory summary with multiple items', async () => {
      const filter: InventoryReportFilter = {};
      const result = await generateInventorySummary(filter);

      expect(result.totalItems).toBe(15); // 10 + 5
      expect(result.totalValue).toBe(7005); // (10 * 100.5) + (5 * 1200)
      expect(Object.keys(result.itemsByCategory)).toHaveLength(2);
      expect(Object.keys(result.itemsByLocation)).toHaveLength(2);
      expect(Object.keys(result.itemsByCondition)).toHaveLength(2);
    });
  });
});