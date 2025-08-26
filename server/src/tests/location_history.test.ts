import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationHistoryTable, inventoryItemsTable, locationsTable, categoriesTable } from '../db/schema';
import { type CreateLocationHistoryInput, type UpdateLocationHistoryInput } from '../schema';
import {
  getLocationHistory,
  getLocationHistoryById,
  getLocationHistoryByItem,
  createLocationHistory,
  updateLocationHistory,
  deleteLocationHistory
} from '../handlers/location_history';
import { eq } from 'drizzle-orm';

// Test data
const testLocation1 = {
  name: 'Warehouse A',
  branch_code: 'WA001',
  address: '123 Storage Ave'
};

const testLocation2 = {
  name: 'Warehouse B',
  branch_code: 'WB001', 
  address: '456 Storage Blvd'
};

const testCategory = {
  name: 'Electronics',
  description: 'Electronic devices and components'
};

const testItem = {
  item_code: 'LAPTOP001',
  name: 'Test Laptop',
  description: 'A laptop for testing',
  condition: 'excellent' as const,
  quantity: 1,
  purchase_price: 999.99,
  purchase_date: new Date('2024-01-15')
};

const testTransferInput: CreateLocationHistoryInput = {
  item_id: 1, // Will be set dynamically
  from_location_id: 1, // Will be set dynamically
  to_location_id: 2, // Will be set dynamically
  transfer_date: new Date('2024-01-20'),
  transferred_by: 'John Doe',
  reason: 'Relocation',
  status: 'pending',
  notes: 'Moving for reorganization'
};

describe('Location History Handlers', () => {
  let locationId1: number;
  let locationId2: number;
  let categoryId: number;
  let itemId: number;

  beforeEach(async () => {
    await createDB();

    // Create test locations
    const location1Result = await db.insert(locationsTable)
      .values(testLocation1)
      .returning()
      .execute();
    locationId1 = location1Result[0].id;

    const location2Result = await db.insert(locationsTable)
      .values(testLocation2)
      .returning()
      .execute();
    locationId2 = location2Result[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    categoryId = categoryResult[0].id;

    // Create test item
    const itemResult = await db.insert(inventoryItemsTable)
      .values({
        ...testItem,
        category_id: categoryId,
        location_id: locationId1,
        purchase_price: testItem.purchase_price.toString()
      })
      .returning()
      .execute();
    itemId = itemResult[0].id;
  });

  afterEach(resetDB);

  describe('getLocationHistory', () => {
    it('should return empty array when no history exists', async () => {
      const result = await getLocationHistory();
      expect(result).toEqual([]);
    });

    it('should return all location history records ordered by created_at desc', async () => {
      // Create test history records separately to ensure different timestamps
      await db.insert(locationHistoryTable)
        .values({
          item_id: itemId,
          from_location_id: locationId1,
          to_location_id: locationId2,
          transfer_date: new Date('2024-01-20'),
          transferred_by: 'User 1',
          status: 'completed',
          reason: 'Test 1',
          notes: null
        })
        .execute();

      await db.insert(locationHistoryTable)
        .values({
          item_id: itemId,
          from_location_id: locationId2,
          to_location_id: locationId1,
          transfer_date: new Date('2024-01-21'),
          transferred_by: 'User 2',
          status: 'pending',
          reason: 'Test 2',
          notes: null
        })
        .execute();

      const result = await getLocationHistory();

      expect(result).toHaveLength(2);
      expect(result[0].transfer_date).toBeInstanceOf(Date);
      expect(result[0].created_at).toBeInstanceOf(Date);
      expect(result[0].updated_at).toBeInstanceOf(Date);
      // Should be ordered by created_at desc (newest first), with id as tie-breaker
      expect(result[0].transferred_by).toBe('User 2');
      expect(result[1].transferred_by).toBe('User 1');
    });
  });

  describe('getLocationHistoryById', () => {
    it('should return null when history record does not exist', async () => {
      const result = await getLocationHistoryById(999);
      expect(result).toBeNull();
    });

    it('should return location history record by ID', async () => {
      const historyResult = await db.insert(locationHistoryTable)
        .values({
          item_id: itemId,
          from_location_id: locationId1,
          to_location_id: locationId2,
          transfer_date: new Date('2024-01-20'),
          transferred_by: 'John Doe',
          status: 'completed',
          reason: 'Relocation',
          notes: 'Test transfer'
        })
        .returning()
        .execute();

      const historyId = historyResult[0].id;
      const result = await getLocationHistoryById(historyId);

      expect(result).toBeDefined();
      expect(result!.id).toBe(historyId);
      expect(result!.item_id).toBe(itemId);
      expect(result!.from_location_id).toBe(locationId1);
      expect(result!.to_location_id).toBe(locationId2);
      expect(result!.transferred_by).toBe('John Doe');
      expect(result!.status).toBe('completed');
      expect(result!.reason).toBe('Relocation');
      expect(result!.notes).toBe('Test transfer');
      expect(result!.transfer_date).toBeInstanceOf(Date);
      expect(result!.created_at).toBeInstanceOf(Date);
      expect(result!.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('getLocationHistoryByItem', () => {
    it('should return empty array when no history exists for item', async () => {
      const result = await getLocationHistoryByItem(itemId);
      expect(result).toEqual([]);
    });

    it('should return location history for specific item ordered by transfer_date desc', async () => {
      // Create multiple history records for the item
      await db.insert(locationHistoryTable)
        .values([
          {
            item_id: itemId,
            from_location_id: null,
            to_location_id: locationId1,
            transfer_date: new Date('2024-01-15'),
            transferred_by: 'System',
            status: 'completed',
            reason: 'Initial placement',
            notes: null
          },
          {
            item_id: itemId,
            from_location_id: locationId1,
            to_location_id: locationId2,
            transfer_date: new Date('2024-01-20'),
            transferred_by: 'John Doe',
            status: 'completed',
            reason: 'Relocation',
            notes: null
          }
        ])
        .execute();

      const result = await getLocationHistoryByItem(itemId);

      expect(result).toHaveLength(2);
      // Should be ordered by transfer_date desc (newest first)
      expect(result[0].transfer_date.getTime()).toBe(new Date('2024-01-20').getTime());
      expect(result[1].transfer_date.getTime()).toBe(new Date('2024-01-15').getTime());
      expect(result[0].reason).toBe('Relocation');
      expect(result[1].reason).toBe('Initial placement');
    });
  });

  describe('createLocationHistory', () => {
    it('should create location history with pending status', async () => {
      const input: CreateLocationHistoryInput = {
        ...testTransferInput,
        item_id: itemId,
        from_location_id: locationId1,
        to_location_id: locationId2
      };

      const result = await createLocationHistory(input);

      expect(result.id).toBeDefined();
      expect(result.item_id).toBe(itemId);
      expect(result.from_location_id).toBe(locationId1);
      expect(result.to_location_id).toBe(locationId2);
      expect(result.transferred_by).toBe('John Doe');
      expect(result.status).toBe('pending');
      expect(result.reason).toBe('Relocation');
      expect(result.notes).toBe('Moving for reorganization');
      expect(result.transfer_date).toBeInstanceOf(Date);
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);

      // Verify item location hasn't changed (status is pending)
      const item = await db.select()
        .from(inventoryItemsTable)
        .where(eq(inventoryItemsTable.id, itemId))
        .execute();
      expect(item[0].location_id).toBe(locationId1);
    });

    it('should create location history with completed status and update item location', async () => {
      const input: CreateLocationHistoryInput = {
        ...testTransferInput,
        item_id: itemId,
        from_location_id: locationId1,
        to_location_id: locationId2,
        status: 'completed'
      };

      const result = await createLocationHistory(input);

      expect(result.status).toBe('completed');

      // Verify item location has been updated
      const item = await db.select()
        .from(inventoryItemsTable)
        .where(eq(inventoryItemsTable.id, itemId))
        .execute();
      expect(item[0].location_id).toBe(locationId2);
    });

    it('should create location history with null from_location_id', async () => {
      const input: CreateLocationHistoryInput = {
        ...testTransferInput,
        item_id: itemId,
        from_location_id: null,
        to_location_id: locationId2,
        reason: 'Initial placement'
      };

      const result = await createLocationHistory(input);

      expect(result.from_location_id).toBeNull();
      expect(result.to_location_id).toBe(locationId2);
      expect(result.reason).toBe('Initial placement');
    });

    it('should throw error when item does not exist', async () => {
      const input: CreateLocationHistoryInput = {
        ...testTransferInput,
        item_id: 999,
        from_location_id: locationId1,
        to_location_id: locationId2
      };

      expect(createLocationHistory(input)).rejects.toThrow(/Item with ID 999 does not exist/i);
    });

    it('should throw error when to_location does not exist', async () => {
      const input: CreateLocationHistoryInput = {
        ...testTransferInput,
        item_id: itemId,
        from_location_id: locationId1,
        to_location_id: 999
      };

      expect(createLocationHistory(input)).rejects.toThrow(/Location with ID 999 does not exist/i);
    });

    it('should throw error when from_location does not exist', async () => {
      const input: CreateLocationHistoryInput = {
        ...testTransferInput,
        item_id: itemId,
        from_location_id: 999,
        to_location_id: locationId2
      };

      expect(createLocationHistory(input)).rejects.toThrow(/Location with ID 999 does not exist/i);
    });
  });

  describe('updateLocationHistory', () => {
    let historyId: number;

    beforeEach(async () => {
      const historyResult = await db.insert(locationHistoryTable)
        .values({
          item_id: itemId,
          from_location_id: locationId1,
          to_location_id: locationId2,
          transfer_date: new Date('2024-01-20'),
          transferred_by: 'John Doe',
          status: 'pending',
          reason: 'Relocation',
          notes: 'Original notes'
        })
        .returning()
        .execute();
      historyId = historyResult[0].id;
    });

    it('should update location history status and notes', async () => {
      const input: UpdateLocationHistoryInput = {
        id: historyId,
        status: 'in_transit',
        notes: 'Updated notes'
      };

      const result = await updateLocationHistory(input);

      expect(result.id).toBe(historyId);
      expect(result.status).toBe('in_transit');
      expect(result.notes).toBe('Updated notes');
      expect(result.updated_at).toBeInstanceOf(Date);

      // Verify item location hasn't changed (status is not completed)
      const item = await db.select()
        .from(inventoryItemsTable)
        .where(eq(inventoryItemsTable.id, itemId))
        .execute();
      expect(item[0].location_id).toBe(locationId1);
    });

    it('should update status to completed and update item location', async () => {
      const input: UpdateLocationHistoryInput = {
        id: historyId,
        status: 'completed',
        notes: 'Transfer completed'
      };

      const result = await updateLocationHistory(input);

      expect(result.status).toBe('completed');
      expect(result.notes).toBe('Transfer completed');

      // Verify item location has been updated
      const item = await db.select()
        .from(inventoryItemsTable)
        .where(eq(inventoryItemsTable.id, itemId))
        .execute();
      expect(item[0].location_id).toBe(locationId2);
    });

    it('should not update item location if status was already completed', async () => {
      // First set status to completed
      await db.update(locationHistoryTable)
        .set({ status: 'completed' })
        .where(eq(locationHistoryTable.id, historyId))
        .execute();

      // Update item location to simulate it was already moved
      await db.update(inventoryItemsTable)
        .set({ location_id: locationId2 })
        .where(eq(inventoryItemsTable.id, itemId))
        .execute();

      const input: UpdateLocationHistoryInput = {
        id: historyId,
        status: 'completed',
        notes: 'Already completed'
      };

      const result = await updateLocationHistory(input);

      expect(result.status).toBe('completed');
      expect(result.notes).toBe('Already completed');

      // Item location should remain at locationId2
      const item = await db.select()
        .from(inventoryItemsTable)
        .where(eq(inventoryItemsTable.id, itemId))
        .execute();
      expect(item[0].location_id).toBe(locationId2);
    });

    it('should throw error when history record does not exist', async () => {
      const input: UpdateLocationHistoryInput = {
        id: 999,
        status: 'completed'
      };

      expect(updateLocationHistory(input)).rejects.toThrow(/Location history with ID 999 does not exist/i);
    });
  });

  describe('deleteLocationHistory', () => {
    it('should delete location history record', async () => {
      const historyResult = await db.insert(locationHistoryTable)
        .values({
          item_id: itemId,
          from_location_id: locationId1,
          to_location_id: locationId2,
          transfer_date: new Date('2024-01-20'),
          transferred_by: 'John Doe',
          status: 'pending',
          reason: 'Relocation',
          notes: null
        })
        .returning()
        .execute();

      const historyId = historyResult[0].id;
      const result = await deleteLocationHistory(historyId);

      expect(result).toBe(true);

      // Verify record was deleted
      const deleted = await db.select()
        .from(locationHistoryTable)
        .where(eq(locationHistoryTable.id, historyId))
        .execute();
      expect(deleted).toHaveLength(0);
    });

    it('should return false when trying to delete non-existent record', async () => {
      const result = await deleteLocationHistory(999);
      expect(result).toBe(false);
    });
  });
});