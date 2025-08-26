import { db } from '../db';
import { locationHistoryTable, inventoryItemsTable, locationsTable } from '../db/schema';
import { type LocationHistory, type CreateLocationHistoryInput, type UpdateLocationHistoryInput } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getLocationHistory(): Promise<LocationHistory[]> {
  try {
    const results = await db.select()
      .from(locationHistoryTable)
      .orderBy(desc(locationHistoryTable.created_at), desc(locationHistoryTable.id))
      .execute();

    return results.map(record => ({
      ...record,
      transfer_date: new Date(record.transfer_date),
      created_at: new Date(record.created_at),
      updated_at: new Date(record.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch location history:', error);
    throw error;
  }
}

export async function getLocationHistoryById(id: number): Promise<LocationHistory | null> {
  try {
    const results = await db.select()
      .from(locationHistoryTable)
      .where(eq(locationHistoryTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const record = results[0];
    return {
      ...record,
      transfer_date: new Date(record.transfer_date),
      created_at: new Date(record.created_at),
      updated_at: new Date(record.updated_at)
    };
  } catch (error) {
    console.error('Failed to fetch location history by ID:', error);
    throw error;
  }
}

export async function getLocationHistoryByItem(itemId: number): Promise<LocationHistory[]> {
  try {
    const results = await db.select()
      .from(locationHistoryTable)
      .where(eq(locationHistoryTable.item_id, itemId))
      .orderBy(desc(locationHistoryTable.transfer_date))
      .execute();

    return results.map(record => ({
      ...record,
      transfer_date: new Date(record.transfer_date),
      created_at: new Date(record.created_at),
      updated_at: new Date(record.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch location history by item:', error);
    throw error;
  }
}

export async function createLocationHistory(input: CreateLocationHistoryInput): Promise<LocationHistory> {
  try {
    // Validate that the item exists
    const itemExists = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, input.item_id))
      .execute();

    if (itemExists.length === 0) {
      throw new Error(`Item with ID ${input.item_id} does not exist`);
    }

    // Validate that the to_location exists
    const toLocationExists = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, input.to_location_id))
      .execute();

    if (toLocationExists.length === 0) {
      throw new Error(`Location with ID ${input.to_location_id} does not exist`);
    }

    // Validate from_location if provided
    if (input.from_location_id !== null) {
      const fromLocationExists = await db.select()
        .from(locationsTable)
        .where(eq(locationsTable.id, input.from_location_id))
        .execute();

      if (fromLocationExists.length === 0) {
        throw new Error(`Location with ID ${input.from_location_id} does not exist`);
      }
    }

    // Create the location history record
    const result = await db.insert(locationHistoryTable)
      .values({
        item_id: input.item_id,
        from_location_id: input.from_location_id,
        to_location_id: input.to_location_id,
        transfer_date: input.transfer_date,
        transferred_by: input.transferred_by,
        reason: input.reason,
        status: input.status,
        notes: input.notes
      })
      .returning()
      .execute();

    // If status is 'completed', update the item's current location
    if (input.status === 'completed') {
      await db.update(inventoryItemsTable)
        .set({ 
          location_id: input.to_location_id,
          updated_at: new Date()
        })
        .where(eq(inventoryItemsTable.id, input.item_id))
        .execute();
    }

    const record = result[0];
    return {
      ...record,
      transfer_date: new Date(record.transfer_date),
      created_at: new Date(record.created_at),
      updated_at: new Date(record.updated_at)
    };
  } catch (error) {
    console.error('Failed to create location history:', error);
    throw error;
  }
}

export async function updateLocationHistory(input: UpdateLocationHistoryInput): Promise<LocationHistory> {
  try {
    // First, get the current record to check if status is changing
    const currentRecord = await db.select()
      .from(locationHistoryTable)
      .where(eq(locationHistoryTable.id, input.id))
      .execute();

    if (currentRecord.length === 0) {
      throw new Error(`Location history with ID ${input.id} does not exist`);
    }

    const current = currentRecord[0];

    // Update the location history record
    const result = await db.update(locationHistoryTable)
      .set({
        status: input.status,
        notes: input.notes,
        updated_at: new Date()
      })
      .where(eq(locationHistoryTable.id, input.id))
      .returning()
      .execute();

    // If status changes to 'completed' and it wasn't already completed, update the item's location
    if (input.status === 'completed' && current.status !== 'completed') {
      await db.update(inventoryItemsTable)
        .set({ 
          location_id: current.to_location_id,
          updated_at: new Date()
        })
        .where(eq(inventoryItemsTable.id, current.item_id))
        .execute();
    }

    const record = result[0];
    return {
      ...record,
      transfer_date: new Date(record.transfer_date),
      created_at: new Date(record.created_at),
      updated_at: new Date(record.updated_at)
    };
  } catch (error) {
    console.error('Failed to update location history:', error);
    throw error;
  }
}

export async function deleteLocationHistory(id: number): Promise<boolean> {
  try {
    const result = await db.delete(locationHistoryTable)
      .where(eq(locationHistoryTable.id, id))
      .returning()
      .execute();

    return result.length > 0;
  } catch (error) {
    console.error('Failed to delete location history:', error);
    throw error;
  }
}