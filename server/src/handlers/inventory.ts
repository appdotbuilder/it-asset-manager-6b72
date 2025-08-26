import { db } from '../db';
import { inventoryItemsTable, categoriesTable, locationsTable } from '../db/schema';
import { type InventoryItem, type CreateInventoryItemInput, type UpdateInventoryItemInput, type BatchImportInput } from '../schema';
import { eq, and, SQL } from 'drizzle-orm';

export async function getInventoryItems(): Promise<InventoryItem[]> {
  try {
    const results = await db.select()
      .from(inventoryItemsTable)
      .execute();

    return results.map(item => ({
      ...item,
      purchase_price: parseFloat(item.purchase_price)
    }));
  } catch (error) {
    console.error('Failed to fetch inventory items:', error);
    throw error;
  }
}

export async function getInventoryItemById(id: number): Promise<InventoryItem | null> {
  try {
    const results = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const item = results[0];
    return {
      ...item,
      purchase_price: parseFloat(item.purchase_price)
    };
  } catch (error) {
    console.error('Failed to fetch inventory item by ID:', error);
    throw error;
  }
}

export async function getInventoryItemByCode(code: string): Promise<InventoryItem | null> {
  try {
    const results = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.item_code, code))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const item = results[0];
    return {
      ...item,
      purchase_price: parseFloat(item.purchase_price)
    };
  } catch (error) {
    console.error('Failed to fetch inventory item by code:', error);
    throw error;
  }
}

export async function createInventoryItem(input: CreateInventoryItemInput): Promise<InventoryItem> {
  try {
    // Verify category exists
    const categoryExists = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, input.category_id))
      .execute();

    if (categoryExists.length === 0) {
      throw new Error(`Category with ID ${input.category_id} does not exist`);
    }

    // Verify location exists
    const locationExists = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, input.location_id))
      .execute();

    if (locationExists.length === 0) {
      throw new Error(`Location with ID ${input.location_id} does not exist`);
    }

    const results = await db.insert(inventoryItemsTable)
      .values({
        item_code: input.item_code,
        name: input.name,
        description: input.description,
        category_id: input.category_id,
        location_id: input.location_id,
        condition: input.condition,
        quantity: input.quantity,
        purchase_price: input.purchase_price.toString(),
        purchase_date: input.purchase_date
      })
      .returning()
      .execute();

    const item = results[0];
    return {
      ...item,
      purchase_price: parseFloat(item.purchase_price)
    };
  } catch (error) {
    console.error('Failed to create inventory item:', error);
    throw error;
  }
}

export async function updateInventoryItem(input: UpdateInventoryItemInput): Promise<InventoryItem> {
  try {
    // Verify item exists
    const existingItem = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, input.id))
      .execute();

    if (existingItem.length === 0) {
      throw new Error(`Inventory item with ID ${input.id} does not exist`);
    }

    // Verify category exists if provided
    if (input.category_id !== undefined) {
      const categoryExists = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, input.category_id))
        .execute();

      if (categoryExists.length === 0) {
        throw new Error(`Category with ID ${input.category_id} does not exist`);
      }
    }

    // Verify location exists if provided
    if (input.location_id !== undefined) {
      const locationExists = await db.select()
        .from(locationsTable)
        .where(eq(locationsTable.id, input.location_id))
        .execute();

      if (locationExists.length === 0) {
        throw new Error(`Location with ID ${input.location_id} does not exist`);
      }
    }

    // Build update values, excluding undefined fields
    const updateValues: any = {
      updated_at: new Date()
    };

    if (input.item_code !== undefined) updateValues.item_code = input.item_code;
    if (input.name !== undefined) updateValues.name = input.name;
    if (input.description !== undefined) updateValues.description = input.description;
    if (input.category_id !== undefined) updateValues.category_id = input.category_id;
    if (input.location_id !== undefined) updateValues.location_id = input.location_id;
    if (input.condition !== undefined) updateValues.condition = input.condition;
    if (input.quantity !== undefined) updateValues.quantity = input.quantity;
    if (input.purchase_price !== undefined) updateValues.purchase_price = input.purchase_price.toString();
    if (input.purchase_date !== undefined) updateValues.purchase_date = input.purchase_date;

    const results = await db.update(inventoryItemsTable)
      .set(updateValues)
      .where(eq(inventoryItemsTable.id, input.id))
      .returning()
      .execute();

    const item = results[0];
    return {
      ...item,
      purchase_price: parseFloat(item.purchase_price)
    };
  } catch (error) {
    console.error('Failed to update inventory item:', error);
    throw error;
  }
}

export async function deleteInventoryItem(id: number): Promise<boolean> {
  try {
    // Verify item exists
    const existingItem = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, id))
      .execute();

    if (existingItem.length === 0) {
      throw new Error(`Inventory item with ID ${id} does not exist`);
    }

    await db.delete(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, id))
      .execute();

    return true;
  } catch (error) {
    console.error('Failed to delete inventory item:', error);
    throw error;
  }
}

export async function batchImportItems(input: BatchImportInput): Promise<{ success: number; errors: string[] }> {
  try {
    let successCount = 0;
    const errors: string[] = [];

    // Get all existing categories and locations
    const categories = await db.select().from(categoriesTable).execute();
    const locations = await db.select().from(locationsTable).execute();

    const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));
    const locationMap = new Map(locations.map(l => [l.name.toLowerCase(), l.id]));

    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i];
      try {
        // Find or create category
        let categoryId = categoryMap.get(item.category_name.toLowerCase());
        if (!categoryId) {
          const newCategory = await db.insert(categoriesTable)
            .values({
              name: item.category_name,
              description: null
            })
            .returning()
            .execute();
          categoryId = newCategory[0].id;
          categoryMap.set(item.category_name.toLowerCase(), categoryId);
        }

        // Find or create location
        let locationId = locationMap.get(item.location_name.toLowerCase());
        if (!locationId) {
          // Generate a simple branch code from location name
          const branchCode = item.location_name.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 100);
          const newLocation = await db.insert(locationsTable)
            .values({
              name: item.location_name,
              branch_code: branchCode,
              address: null
            })
            .returning()
            .execute();
          locationId = newLocation[0].id;
          locationMap.set(item.location_name.toLowerCase(), locationId);
        }

        // Create inventory item
        await db.insert(inventoryItemsTable)
          .values({
            item_code: item.item_code,
            name: item.name,
            description: item.description,
            category_id: categoryId,
            location_id: locationId,
            condition: item.condition,
            quantity: item.quantity,
            purchase_price: item.purchase_price.toString(),
            purchase_date: item.purchase_date
          })
          .execute();

        successCount++;
      } catch (itemError) {
        errors.push(`Item ${i + 1} (${item.item_code}): ${itemError instanceof Error ? itemError.message : 'Unknown error'}`);
      }
    }

    return {
      success: successCount,
      errors
    };
  } catch (error) {
    console.error('Failed to batch import items:', error);
    throw error;
  }
}