import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inventoryItemsTable, categoriesTable, locationsTable } from '../db/schema';
import { type CreateInventoryItemInput, type UpdateInventoryItemInput, type BatchImportInput } from '../schema';
import { 
  getInventoryItems, 
  getInventoryItemById, 
  getInventoryItemByCode,
  createInventoryItem, 
  updateInventoryItem, 
  deleteInventoryItem,
  batchImportItems
} from '../handlers/inventory';
import { eq } from 'drizzle-orm';

// Test data
const testCategory = {
  name: 'Electronics',
  description: 'Electronic devices and components'
};

const testLocation = {
  name: 'Main Warehouse',
  branch_code: 'MW001',
  address: '123 Main St'
};

const testInventoryItemInput: CreateInventoryItemInput = {
  item_code: 'ELC001',
  name: 'Laptop Computer',
  description: 'High-performance business laptop',
  category_id: 0, // Will be set after creating category
  location_id: 0, // Will be set after creating location
  condition: 'excellent',
  quantity: 5,
  purchase_price: 1200.00,
  purchase_date: new Date('2024-01-15')
};

describe('inventory handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let categoryId: number;
  let locationId: number;

  beforeEach(async () => {
    // Create test category and location
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    categoryId = categoryResult[0].id;

    const locationResult = await db.insert(locationsTable)
      .values(testLocation)
      .returning()
      .execute();
    locationId = locationResult[0].id;

    // Update test input with actual IDs
    testInventoryItemInput.category_id = categoryId;
    testInventoryItemInput.location_id = locationId;
  });

  describe('getInventoryItems', () => {
    it('should return empty array when no items exist', async () => {
      const result = await getInventoryItems();
      expect(result).toHaveLength(0);
    });

    it('should return all inventory items with numeric conversion', async () => {
      // Create test item
      await db.insert(inventoryItemsTable)
        .values({
          ...testInventoryItemInput,
          purchase_price: testInventoryItemInput.purchase_price.toString()
        })
        .execute();

      const result = await getInventoryItems();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Laptop Computer');
      expect(result[0].item_code).toBe('ELC001');
      expect(result[0].purchase_price).toBe(1200.00);
      expect(typeof result[0].purchase_price).toBe('number');
      expect(result[0].quantity).toBe(5);
      expect(result[0].condition).toBe('excellent');
    });
  });

  describe('getInventoryItemById', () => {
    it('should return null for non-existent item', async () => {
      const result = await getInventoryItemById(999);
      expect(result).toBeNull();
    });

    it('should return inventory item by ID with numeric conversion', async () => {
      // Create test item
      const insertResult = await db.insert(inventoryItemsTable)
        .values({
          ...testInventoryItemInput,
          purchase_price: testInventoryItemInput.purchase_price.toString()
        })
        .returning()
        .execute();

      const itemId = insertResult[0].id;
      const result = await getInventoryItemById(itemId);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(itemId);
      expect(result!.name).toBe('Laptop Computer');
      expect(result!.purchase_price).toBe(1200.00);
      expect(typeof result!.purchase_price).toBe('number');
    });
  });

  describe('getInventoryItemByCode', () => {
    it('should return null for non-existent item code', async () => {
      const result = await getInventoryItemByCode('NONEXISTENT');
      expect(result).toBeNull();
    });

    it('should return inventory item by code with numeric conversion', async () => {
      // Create test item
      await db.insert(inventoryItemsTable)
        .values({
          ...testInventoryItemInput,
          purchase_price: testInventoryItemInput.purchase_price.toString()
        })
        .execute();

      const result = await getInventoryItemByCode('ELC001');

      expect(result).not.toBeNull();
      expect(result!.item_code).toBe('ELC001');
      expect(result!.name).toBe('Laptop Computer');
      expect(result!.purchase_price).toBe(1200.00);
      expect(typeof result!.purchase_price).toBe('number');
    });
  });

  describe('createInventoryItem', () => {
    it('should create inventory item with all fields', async () => {
      const result = await createInventoryItem(testInventoryItemInput);

      expect(result.item_code).toBe('ELC001');
      expect(result.name).toBe('Laptop Computer');
      expect(result.description).toBe('High-performance business laptop');
      expect(result.category_id).toBe(categoryId);
      expect(result.location_id).toBe(locationId);
      expect(result.condition).toBe('excellent');
      expect(result.quantity).toBe(5);
      expect(result.purchase_price).toBe(1200.00);
      expect(typeof result.purchase_price).toBe('number');
      expect(result.purchase_date).toEqual(new Date('2024-01-15'));
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should save inventory item to database', async () => {
      const result = await createInventoryItem(testInventoryItemInput);

      const dbItems = await db.select()
        .from(inventoryItemsTable)
        .where(eq(inventoryItemsTable.id, result.id))
        .execute();

      expect(dbItems).toHaveLength(1);
      expect(dbItems[0].name).toBe('Laptop Computer');
      expect(dbItems[0].item_code).toBe('ELC001');
      expect(parseFloat(dbItems[0].purchase_price)).toBe(1200.00);
    });

    it('should throw error for non-existent category', async () => {
      const invalidInput = { ...testInventoryItemInput, category_id: 999 };
      
      await expect(createInventoryItem(invalidInput))
        .rejects.toThrow(/Category with ID 999 does not exist/);
    });

    it('should throw error for non-existent location', async () => {
      const invalidInput = { ...testInventoryItemInput, location_id: 999 };
      
      await expect(createInventoryItem(invalidInput))
        .rejects.toThrow(/Location with ID 999 does not exist/);
    });
  });

  describe('updateInventoryItem', () => {
    let itemId: number;

    beforeEach(async () => {
      const result = await db.insert(inventoryItemsTable)
        .values({
          ...testInventoryItemInput,
          purchase_price: testInventoryItemInput.purchase_price.toString()
        })
        .returning()
        .execute();
      itemId = result[0].id;
    });

    it('should update inventory item fields', async () => {
      const updateInput: UpdateInventoryItemInput = {
        id: itemId,
        name: 'Updated Laptop',
        quantity: 10,
        purchase_price: 1500.00,
        condition: 'good'
      };

      const result = await updateInventoryItem(updateInput);

      expect(result.id).toBe(itemId);
      expect(result.name).toBe('Updated Laptop');
      expect(result.quantity).toBe(10);
      expect(result.purchase_price).toBe(1500.00);
      expect(typeof result.purchase_price).toBe('number');
      expect(result.condition).toBe('good');
      expect(result.item_code).toBe('ELC001'); // Unchanged
    });

    it('should save updated inventory item to database', async () => {
      const updateInput: UpdateInventoryItemInput = {
        id: itemId,
        name: 'Updated Laptop',
        quantity: 10
      };

      await updateInventoryItem(updateInput);

      const dbItems = await db.select()
        .from(inventoryItemsTable)
        .where(eq(inventoryItemsTable.id, itemId))
        .execute();

      expect(dbItems[0].name).toBe('Updated Laptop');
      expect(dbItems[0].quantity).toBe(10);
    });

    it('should throw error for non-existent item', async () => {
      const updateInput: UpdateInventoryItemInput = {
        id: 999,
        name: 'Updated Item'
      };

      await expect(updateInventoryItem(updateInput))
        .rejects.toThrow(/Inventory item with ID 999 does not exist/);
    });

    it('should throw error for non-existent category in update', async () => {
      const updateInput: UpdateInventoryItemInput = {
        id: itemId,
        category_id: 999
      };

      await expect(updateInventoryItem(updateInput))
        .rejects.toThrow(/Category with ID 999 does not exist/);
    });

    it('should throw error for non-existent location in update', async () => {
      const updateInput: UpdateInventoryItemInput = {
        id: itemId,
        location_id: 999
      };

      await expect(updateInventoryItem(updateInput))
        .rejects.toThrow(/Location with ID 999 does not exist/);
    });
  });

  describe('deleteInventoryItem', () => {
    let itemId: number;

    beforeEach(async () => {
      const result = await db.insert(inventoryItemsTable)
        .values({
          ...testInventoryItemInput,
          purchase_price: testInventoryItemInput.purchase_price.toString()
        })
        .returning()
        .execute();
      itemId = result[0].id;
    });

    it('should delete inventory item and return true', async () => {
      const result = await deleteInventoryItem(itemId);
      expect(result).toBe(true);

      // Verify item is deleted
      const dbItems = await db.select()
        .from(inventoryItemsTable)
        .where(eq(inventoryItemsTable.id, itemId))
        .execute();

      expect(dbItems).toHaveLength(0);
    });

    it('should throw error for non-existent item', async () => {
      await expect(deleteInventoryItem(999))
        .rejects.toThrow(/Inventory item with ID 999 does not exist/);
    });
  });

  describe('batchImportItems', () => {
    it('should import multiple items with existing categories and locations', async () => {
      const batchInput: BatchImportInput = {
        items: [
          {
            item_code: 'BATCH001',
            name: 'Batch Item 1',
            description: 'First batch item',
            category_name: 'Electronics',
            location_name: 'Main Warehouse',
            condition: 'excellent',
            quantity: 3,
            purchase_price: 500.00,
            purchase_date: new Date('2024-01-10')
          },
          {
            item_code: 'BATCH002',
            name: 'Batch Item 2',
            description: 'Second batch item',
            category_name: 'Electronics',
            location_name: 'Main Warehouse',
            condition: 'good',
            quantity: 2,
            purchase_price: 750.00,
            purchase_date: new Date('2024-01-11')
          }
        ]
      };

      const result = await batchImportItems(batchInput);

      expect(result.success).toBe(2);
      expect(result.errors).toHaveLength(0);

      // Verify items were created
      const dbItems = await db.select().from(inventoryItemsTable).execute();
      expect(dbItems).toHaveLength(2);
      
      const item1 = dbItems.find(item => item.item_code === 'BATCH001');
      expect(item1).toBeDefined();
      expect(item1!.name).toBe('Batch Item 1');
      expect(parseFloat(item1!.purchase_price)).toBe(500.00);
    });

    it('should create new categories and locations when needed', async () => {
      const batchInput: BatchImportInput = {
        items: [
          {
            item_code: 'BATCH003',
            name: 'New Category Item',
            description: null,
            category_name: 'Office Supplies',
            location_name: 'Branch Office',
            condition: 'fair',
            quantity: 1,
            purchase_price: 25.00,
            purchase_date: new Date('2024-01-12')
          }
        ]
      };

      const result = await batchImportItems(batchInput);

      expect(result.success).toBe(1);
      expect(result.errors).toHaveLength(0);

      // Verify new category was created
      const categories = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.name, 'Office Supplies'))
        .execute();
      expect(categories).toHaveLength(1);

      // Verify new location was created
      const locations = await db.select()
        .from(locationsTable)
        .where(eq(locationsTable.name, 'Branch Office'))
        .execute();
      expect(locations).toHaveLength(1);
      expect(locations[0].branch_code).toMatch(/^BRA\d+$/); // Generated branch code
    });

    it('should handle mixed success and errors', async () => {
      // Create an item with duplicate code first
      await db.insert(inventoryItemsTable)
        .values({
          ...testInventoryItemInput,
          item_code: 'DUPLICATE',
          purchase_price: testInventoryItemInput.purchase_price.toString()
        })
        .execute();

      const batchInput: BatchImportInput = {
        items: [
          {
            item_code: 'BATCH004',
            name: 'Valid Item',
            description: null,
            category_name: 'Electronics',
            location_name: 'Main Warehouse',
            condition: 'excellent',
            quantity: 1,
            purchase_price: 100.00,
            purchase_date: new Date('2024-01-13')
          },
          {
            item_code: 'DUPLICATE',
            name: 'Invalid Item',
            description: null,
            category_name: 'Electronics',
            location_name: 'Main Warehouse',
            condition: 'good',
            quantity: 1,
            purchase_price: 200.00,
            purchase_date: new Date('2024-01-14')
          }
        ]
      };

      const result = await batchImportItems(batchInput);

      expect(result.success).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Item 2 (DUPLICATE)');
    });

    it('should return empty results for empty batch', async () => {
      const batchInput: BatchImportInput = { items: [] };
      const result = await batchImportItems(batchInput);

      expect(result.success).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });
});