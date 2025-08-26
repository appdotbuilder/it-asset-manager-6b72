import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { type Supplier, type CreateSupplierInput, type UpdateSupplierInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function getSuppliers(): Promise<Supplier[]> {
  try {
    const results = await db.select()
      .from(suppliersTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch suppliers:', error);
    throw error;
  }
}

export async function getSupplierById(id: number): Promise<Supplier | null> {
  try {
    const results = await db.select()
      .from(suppliersTable)
      .where(eq(suppliersTable.id, id))
      .execute();

    return results[0] || null;
  } catch (error) {
    console.error('Failed to fetch supplier by ID:', error);
    throw error;
  }
}

export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  try {
    const result = await db.insert(suppliersTable)
      .values({
        name: input.name,
        contact_person: input.contact_person,
        phone_number: input.phone_number,
        address: input.address
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Failed to create supplier:', error);
    throw error;
  }
}

export async function updateSupplier(input: UpdateSupplierInput): Promise<Supplier> {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof suppliersTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.contact_person !== undefined) {
      updateData.contact_person = input.contact_person;
    }
    if (input.phone_number !== undefined) {
      updateData.phone_number = input.phone_number;
    }
    if (input.address !== undefined) {
      updateData.address = input.address;
    }

    // Add updated timestamp
    updateData.updated_at = new Date();

    const result = await db.update(suppliersTable)
      .set(updateData)
      .where(eq(suppliersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Supplier with ID ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Failed to update supplier:', error);
    throw error;
  }
}

export async function deleteSupplier(id: number): Promise<boolean> {
  try {
    const result = await db.delete(suppliersTable)
      .where(eq(suppliersTable.id, id))
      .returning()
      .execute();

    return result.length > 0;
  } catch (error) {
    console.error('Failed to delete supplier:', error);
    throw error;
  }
}