import { db } from '../db';
import { purchasesTable, inventoryItemsTable, suppliersTable } from '../db/schema';
import { type Purchase, type CreatePurchaseInput, type UpdatePurchaseInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function getPurchases(): Promise<Purchase[]> {
  try {
    const results = await db.select()
      .from(purchasesTable)
      .execute();

    return results.map(purchase => ({
      ...purchase,
      unit_price: parseFloat(purchase.unit_price),
      total_price: parseFloat(purchase.total_price)
    }));
  } catch (error) {
    console.error('Failed to fetch purchases:', error);
    throw error;
  }
}

export async function getPurchaseById(id: number): Promise<Purchase | null> {
  try {
    const results = await db.select()
      .from(purchasesTable)
      .where(eq(purchasesTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const purchase = results[0];
    return {
      ...purchase,
      unit_price: parseFloat(purchase.unit_price),
      total_price: parseFloat(purchase.total_price)
    };
  } catch (error) {
    console.error('Failed to fetch purchase by ID:', error);
    throw error;
  }
}

export async function getPurchasesByItem(itemId: number): Promise<Purchase[]> {
  try {
    const results = await db.select()
      .from(purchasesTable)
      .where(eq(purchasesTable.item_id, itemId))
      .execute();

    return results.map(purchase => ({
      ...purchase,
      unit_price: parseFloat(purchase.unit_price),
      total_price: parseFloat(purchase.total_price)
    }));
  } catch (error) {
    console.error('Failed to fetch purchases by item:', error);
    throw error;
  }
}

export async function getPurchasesBySupplier(supplierId: number): Promise<Purchase[]> {
  try {
    const results = await db.select()
      .from(purchasesTable)
      .where(eq(purchasesTable.supplier_id, supplierId))
      .execute();

    return results.map(purchase => ({
      ...purchase,
      unit_price: parseFloat(purchase.unit_price),
      total_price: parseFloat(purchase.total_price)
    }));
  } catch (error) {
    console.error('Failed to fetch purchases by supplier:', error);
    throw error;
  }
}

export async function createPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  try {
    // Calculate total price
    const totalPrice = input.quantity * input.unit_price;

    // Verify item exists
    const itemExists = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, input.item_id))
      .execute();

    if (itemExists.length === 0) {
      throw new Error(`Inventory item with ID ${input.item_id} does not exist`);
    }

    // Verify supplier exists
    const supplierExists = await db.select()
      .from(suppliersTable)
      .where(eq(suppliersTable.id, input.supplier_id))
      .execute();

    if (supplierExists.length === 0) {
      throw new Error(`Supplier with ID ${input.supplier_id} does not exist`);
    }

    // Create purchase record
    const results = await db.insert(purchasesTable)
      .values({
        item_id: input.item_id,
        supplier_id: input.supplier_id,
        quantity: input.quantity,
        unit_price: input.unit_price.toString(),
        total_price: totalPrice.toString(),
        purchase_date: input.purchase_date,
        notes: input.notes
      })
      .returning()
      .execute();

    const purchase = results[0];
    return {
      ...purchase,
      unit_price: parseFloat(purchase.unit_price),
      total_price: parseFloat(purchase.total_price)
    };
  } catch (error) {
    console.error('Failed to create purchase:', error);
    throw error;
  }
}

export async function updatePurchase(input: UpdatePurchaseInput): Promise<Purchase> {
  try {
    // Check if purchase exists
    const existing = await db.select()
      .from(purchasesTable)
      .where(eq(purchasesTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      throw new Error(`Purchase with ID ${input.id} does not exist`);
    }

    const currentPurchase = existing[0];

    // Verify item exists if item_id is being updated
    if (input.item_id !== undefined) {
      const itemExists = await db.select()
        .from(inventoryItemsTable)
        .where(eq(inventoryItemsTable.id, input.item_id))
        .execute();

      if (itemExists.length === 0) {
        throw new Error(`Inventory item with ID ${input.item_id} does not exist`);
      }
    }

    // Verify supplier exists if supplier_id is being updated
    if (input.supplier_id !== undefined) {
      const supplierExists = await db.select()
        .from(suppliersTable)
        .where(eq(suppliersTable.id, input.supplier_id))
        .execute();

      if (supplierExists.length === 0) {
        throw new Error(`Supplier with ID ${input.supplier_id} does not exist`);
      }
    }

    // Calculate new values
    const quantity = input.quantity !== undefined ? input.quantity : currentPurchase.quantity;
    const unitPrice = input.unit_price !== undefined ? input.unit_price : parseFloat(currentPurchase.unit_price);
    const totalPrice = quantity * unitPrice;

    // Prepare update values
    const updateValues: any = {
      updated_at: new Date()
    };

    if (input.item_id !== undefined) updateValues.item_id = input.item_id;
    if (input.supplier_id !== undefined) updateValues.supplier_id = input.supplier_id;
    if (input.quantity !== undefined) updateValues.quantity = input.quantity;
    if (input.unit_price !== undefined) updateValues.unit_price = input.unit_price.toString();
    if (input.purchase_date !== undefined) updateValues.purchase_date = input.purchase_date;
    if (input.notes !== undefined) updateValues.notes = input.notes;

    // Always update total_price if quantity or unit_price changed
    if (input.quantity !== undefined || input.unit_price !== undefined) {
      updateValues.total_price = totalPrice.toString();
    }

    // Update purchase record
    const results = await db.update(purchasesTable)
      .set(updateValues)
      .where(eq(purchasesTable.id, input.id))
      .returning()
      .execute();

    const purchase = results[0];
    return {
      ...purchase,
      unit_price: parseFloat(purchase.unit_price),
      total_price: parseFloat(purchase.total_price)
    };
  } catch (error) {
    console.error('Failed to update purchase:', error);
    throw error;
  }
}

export async function deletePurchase(id: number): Promise<boolean> {
  try {
    // Check if purchase exists
    const existing = await db.select()
      .from(purchasesTable)
      .where(eq(purchasesTable.id, id))
      .execute();

    if (existing.length === 0) {
      return false;
    }

    // Delete purchase record
    await db.delete(purchasesTable)
      .where(eq(purchasesTable.id, id))
      .execute();

    return true;
  } catch (error) {
    console.error('Failed to delete purchase:', error);
    throw error;
  }
}