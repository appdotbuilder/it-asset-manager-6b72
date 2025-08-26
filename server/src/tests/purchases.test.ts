import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { purchasesTable, inventoryItemsTable, suppliersTable, categoriesTable, locationsTable } from '../db/schema';
import { type CreatePurchaseInput, type UpdatePurchaseInput } from '../schema';
import {
  getPurchases,
  getPurchaseById,
  getPurchasesByItem,
  getPurchasesBySupplier,
  createPurchase,
  updatePurchase,
  deletePurchase
} from '../handlers/purchases';
import { eq } from 'drizzle-orm';

// Test data setup
let testCategoryId: number;
let testLocationId: number;
let testSupplierId: number;
let testItemId: number;

const createTestData = async () => {
  // Create test category
  const categoryResults = await db.insert(categoriesTable)
    .values({
      name: 'Test Category',
      description: 'Category for testing'
    })
    .returning()
    .execute();
  testCategoryId = categoryResults[0].id;

  // Create test location
  const locationResults = await db.insert(locationsTable)
    .values({
      name: 'Test Location',
      branch_code: 'TEST001',
      address: '123 Test St'
    })
    .returning()
    .execute();
  testLocationId = locationResults[0].id;

  // Create test supplier
  const supplierResults = await db.insert(suppliersTable)
    .values({
      name: 'Test Supplier',
      contact_person: 'John Doe',
      phone_number: '555-0123',
      address: '456 Supplier Ave'
    })
    .returning()
    .execute();
  testSupplierId = supplierResults[0].id;

  // Create test inventory item
  const itemResults = await db.insert(inventoryItemsTable)
    .values({
      item_code: 'TEST001',
      name: 'Test Item',
      description: 'Item for testing',
      category_id: testCategoryId,
      location_id: testLocationId,
      condition: 'excellent',
      quantity: 10,
      purchase_price: '99.99',
      purchase_date: new Date()
    })
    .returning()
    .execute();
  testItemId = itemResults[0].id;
};

const testPurchaseInput: CreatePurchaseInput = {
  item_id: 0, // Will be set dynamically
  supplier_id: 0, // Will be set dynamically
  quantity: 5,
  unit_price: 25.50,
  purchase_date: new Date('2024-01-15'),
  notes: 'Test purchase'
};

describe('Purchase Handlers', () => {
  beforeEach(async () => {
    await createDB();
    await createTestData();
  });
  afterEach(resetDB);

  describe('createPurchase', () => {
    it('should create a purchase with correct total price calculation', async () => {
      const input = {
        ...testPurchaseInput,
        item_id: testItemId,
        supplier_id: testSupplierId
      };

      const result = await createPurchase(input);

      expect(result.item_id).toEqual(testItemId);
      expect(result.supplier_id).toEqual(testSupplierId);
      expect(result.quantity).toEqual(5);
      expect(result.unit_price).toEqual(25.50);
      expect(result.total_price).toEqual(127.50); // 5 * 25.50
      expect(result.purchase_date).toEqual(new Date('2024-01-15'));
      expect(result.notes).toEqual('Test purchase');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save purchase to database', async () => {
      const input = {
        ...testPurchaseInput,
        item_id: testItemId,
        supplier_id: testSupplierId
      };

      const result = await createPurchase(input);

      const purchases = await db.select()
        .from(purchasesTable)
        .where(eq(purchasesTable.id, result.id))
        .execute();

      expect(purchases).toHaveLength(1);
      expect(purchases[0].item_id).toEqual(testItemId);
      expect(purchases[0].supplier_id).toEqual(testSupplierId);
      expect(purchases[0].quantity).toEqual(5);
      expect(parseFloat(purchases[0].unit_price)).toEqual(25.50);
      expect(parseFloat(purchases[0].total_price)).toEqual(127.50);
      expect(purchases[0].notes).toEqual('Test purchase');
    });

    it('should handle numeric conversions correctly', async () => {
      const input = {
        ...testPurchaseInput,
        item_id: testItemId,
        supplier_id: testSupplierId,
        unit_price: 19.99
      };

      const result = await createPurchase(input);

      expect(typeof result.unit_price).toBe('number');
      expect(typeof result.total_price).toBe('number');
      expect(result.unit_price).toEqual(19.99);
      expect(result.total_price).toEqual(99.95); // 5 * 19.99
    });

    it('should throw error for non-existent item', async () => {
      const input = {
        ...testPurchaseInput,
        item_id: 99999,
        supplier_id: testSupplierId
      };

      await expect(createPurchase(input)).rejects.toThrow(/item.*does not exist/i);
    });

    it('should throw error for non-existent supplier', async () => {
      const input = {
        ...testPurchaseInput,
        item_id: testItemId,
        supplier_id: 99999
      };

      await expect(createPurchase(input)).rejects.toThrow(/supplier.*does not exist/i);
    });
  });

  describe('getPurchases', () => {
    it('should return empty array when no purchases exist', async () => {
      const result = await getPurchases();
      expect(result).toEqual([]);
    });

    it('should return all purchases with numeric conversions', async () => {
      // Create multiple purchases
      const input1 = {
        ...testPurchaseInput,
        item_id: testItemId,
        supplier_id: testSupplierId,
        quantity: 3,
        unit_price: 10.50
      };
      const input2 = {
        ...testPurchaseInput,
        item_id: testItemId,
        supplier_id: testSupplierId,
        quantity: 2,
        unit_price: 15.75
      };

      await createPurchase(input1);
      await createPurchase(input2);

      const result = await getPurchases();

      expect(result).toHaveLength(2);
      expect(typeof result[0].unit_price).toBe('number');
      expect(typeof result[0].total_price).toBe('number');
      expect(typeof result[1].unit_price).toBe('number');
      expect(typeof result[1].total_price).toBe('number');

      // Verify calculations
      expect(result[0].total_price).toEqual(31.50); // 3 * 10.50
      expect(result[1].total_price).toEqual(31.50); // 2 * 15.75
    });
  });

  describe('getPurchaseById', () => {
    it('should return null for non-existent purchase', async () => {
      const result = await getPurchaseById(99999);
      expect(result).toBeNull();
    });

    it('should return purchase with correct numeric conversions', async () => {
      const input = {
        ...testPurchaseInput,
        item_id: testItemId,
        supplier_id: testSupplierId
      };

      const created = await createPurchase(input);
      const result = await getPurchaseById(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(typeof result!.unit_price).toBe('number');
      expect(typeof result!.total_price).toBe('number');
      expect(result!.unit_price).toEqual(25.50);
      expect(result!.total_price).toEqual(127.50);
    });
  });

  describe('getPurchasesByItem', () => {
    it('should return empty array for item with no purchases', async () => {
      const result = await getPurchasesByItem(testItemId);
      expect(result).toEqual([]);
    });

    it('should return purchases for specific item', async () => {
      const input = {
        ...testPurchaseInput,
        item_id: testItemId,
        supplier_id: testSupplierId
      };

      await createPurchase(input);
      await createPurchase({ ...input, quantity: 10 });

      const result = await getPurchasesByItem(testItemId);

      expect(result).toHaveLength(2);
      expect(result[0].item_id).toEqual(testItemId);
      expect(result[1].item_id).toEqual(testItemId);
      expect(typeof result[0].unit_price).toBe('number');
      expect(typeof result[1].unit_price).toBe('number');
    });
  });

  describe('getPurchasesBySupplier', () => {
    it('should return empty array for supplier with no purchases', async () => {
      const result = await getPurchasesBySupplier(testSupplierId);
      expect(result).toEqual([]);
    });

    it('should return purchases for specific supplier', async () => {
      const input = {
        ...testPurchaseInput,
        item_id: testItemId,
        supplier_id: testSupplierId
      };

      await createPurchase(input);
      await createPurchase({ ...input, quantity: 8 });

      const result = await getPurchasesBySupplier(testSupplierId);

      expect(result).toHaveLength(2);
      expect(result[0].supplier_id).toEqual(testSupplierId);
      expect(result[1].supplier_id).toEqual(testSupplierId);
      expect(typeof result[0].total_price).toBe('number');
      expect(typeof result[1].total_price).toBe('number');
    });
  });

  describe('updatePurchase', () => {
    it('should throw error for non-existent purchase', async () => {
      const input: UpdatePurchaseInput = {
        id: 99999,
        quantity: 10
      };

      await expect(updatePurchase(input)).rejects.toThrow(/purchase.*does not exist/i);
    });

    it('should update purchase and recalculate total price', async () => {
      const createInput = {
        ...testPurchaseInput,
        item_id: testItemId,
        supplier_id: testSupplierId
      };

      const created = await createPurchase(createInput);

      const updateInput: UpdatePurchaseInput = {
        id: created.id,
        quantity: 10,
        unit_price: 30.00
      };

      const result = await updatePurchase(updateInput);

      expect(result.quantity).toEqual(10);
      expect(result.unit_price).toEqual(30.00);
      expect(result.total_price).toEqual(300.00); // 10 * 30.00
      expect(typeof result.unit_price).toBe('number');
      expect(typeof result.total_price).toBe('number');
    });

    it('should update only specified fields', async () => {
      const createInput = {
        ...testPurchaseInput,
        item_id: testItemId,
        supplier_id: testSupplierId
      };

      const created = await createPurchase(createInput);

      const updateInput: UpdatePurchaseInput = {
        id: created.id,
        notes: 'Updated notes'
      };

      const result = await updatePurchase(updateInput);

      expect(result.notes).toEqual('Updated notes');
      expect(result.quantity).toEqual(created.quantity); // Should remain unchanged
      expect(result.unit_price).toEqual(created.unit_price); // Should remain unchanged
      expect(result.total_price).toEqual(created.total_price); // Should remain unchanged
    });

    it('should recalculate total price when only quantity changes', async () => {
      const createInput = {
        ...testPurchaseInput,
        item_id: testItemId,
        supplier_id: testSupplierId,
        unit_price: 20.00
      };

      const created = await createPurchase(createInput);

      const updateInput: UpdatePurchaseInput = {
        id: created.id,
        quantity: 3
      };

      const result = await updatePurchase(updateInput);

      expect(result.quantity).toEqual(3);
      expect(result.unit_price).toEqual(20.00);
      expect(result.total_price).toEqual(60.00); // 3 * 20.00
    });

    it('should throw error for non-existent item when updating item_id', async () => {
      const createInput = {
        ...testPurchaseInput,
        item_id: testItemId,
        supplier_id: testSupplierId
      };

      const created = await createPurchase(createInput);

      const updateInput: UpdatePurchaseInput = {
        id: created.id,
        item_id: 99999
      };

      await expect(updatePurchase(updateInput)).rejects.toThrow(/item.*does not exist/i);
    });

    it('should throw error for non-existent supplier when updating supplier_id', async () => {
      const createInput = {
        ...testPurchaseInput,
        item_id: testItemId,
        supplier_id: testSupplierId
      };

      const created = await createPurchase(createInput);

      const updateInput: UpdatePurchaseInput = {
        id: created.id,
        supplier_id: 99999
      };

      await expect(updatePurchase(updateInput)).rejects.toThrow(/supplier.*does not exist/i);
    });
  });

  describe('deletePurchase', () => {
    it('should return false for non-existent purchase', async () => {
      const result = await deletePurchase(99999);
      expect(result).toBe(false);
    });

    it('should delete purchase and return true', async () => {
      const createInput = {
        ...testPurchaseInput,
        item_id: testItemId,
        supplier_id: testSupplierId
      };

      const created = await createPurchase(createInput);
      const result = await deletePurchase(created.id);

      expect(result).toBe(true);

      // Verify purchase was deleted
      const purchases = await db.select()
        .from(purchasesTable)
        .where(eq(purchasesTable.id, created.id))
        .execute();

      expect(purchases).toHaveLength(0);
    });
  });
});