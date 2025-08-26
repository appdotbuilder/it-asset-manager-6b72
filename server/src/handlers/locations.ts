import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type Location, type CreateLocationInput, type UpdateLocationInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function getLocations(): Promise<Location[]> {
  try {
    const results = await db.select()
      .from(locationsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    throw error;
  }
}

export async function getLocationById(id: number): Promise<Location | null> {
  try {
    const results = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, id))
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Failed to fetch location by ID:', error);
    throw error;
  }
}

export async function createLocation(input: CreateLocationInput): Promise<Location> {
  try {
    const result = await db.insert(locationsTable)
      .values({
        name: input.name,
        branch_code: input.branch_code,
        address: input.address
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Location creation failed:', error);
    throw error;
  }
}

export async function updateLocation(input: UpdateLocationInput): Promise<Location> {
  try {
    // Build update values object only with provided fields
    const updateValues: any = {
      updated_at: new Date()
    };
    
    if (input.name !== undefined) {
      updateValues.name = input.name;
    }
    
    if (input.branch_code !== undefined) {
      updateValues.branch_code = input.branch_code;
    }
    
    if (input.address !== undefined) {
      updateValues.address = input.address;
    }

    const result = await db.update(locationsTable)
      .set(updateValues)
      .where(eq(locationsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Location with ID ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Location update failed:', error);
    throw error;
  }
}

export async function deleteLocation(id: number): Promise<boolean> {
  try {
    const result = await db.delete(locationsTable)
      .where(eq(locationsTable.id, id))
      .returning()
      .execute();

    return result.length > 0;
  } catch (error) {
    console.error('Location deletion failed:', error);
    throw error;
  }
}