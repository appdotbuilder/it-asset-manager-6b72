import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type CreateLocationInput, type UpdateLocationInput } from '../schema';
import { 
  getLocations, 
  getLocationById, 
  createLocation, 
  updateLocation, 
  deleteLocation 
} from '../handlers/locations';
import { eq } from 'drizzle-orm';

// Test inputs
const testLocationInput: CreateLocationInput = {
  name: 'Test Location',
  branch_code: 'TL001',
  address: '123 Test Street'
};

const testLocationInputWithNullAddress: CreateLocationInput = {
  name: 'Location No Address',
  branch_code: 'LNA001',
  address: null
};

describe('Location Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createLocation', () => {
    it('should create a location with all fields', async () => {
      const result = await createLocation(testLocationInput);

      expect(result.name).toEqual('Test Location');
      expect(result.branch_code).toEqual('TL001');
      expect(result.address).toEqual('123 Test Street');
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('number');
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create a location with null address', async () => {
      const result = await createLocation(testLocationInputWithNullAddress);

      expect(result.name).toEqual('Location No Address');
      expect(result.branch_code).toEqual('LNA001');
      expect(result.address).toBeNull();
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save location to database', async () => {
      const result = await createLocation(testLocationInput);

      const locations = await db.select()
        .from(locationsTable)
        .where(eq(locationsTable.id, result.id))
        .execute();

      expect(locations).toHaveLength(1);
      expect(locations[0].name).toEqual('Test Location');
      expect(locations[0].branch_code).toEqual('TL001');
      expect(locations[0].address).toEqual('123 Test Street');
    });
  });

  describe('getLocations', () => {
    it('should return empty array when no locations exist', async () => {
      const result = await getLocations();

      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return all locations', async () => {
      // Create test locations
      await createLocation(testLocationInput);
      await createLocation(testLocationInputWithNullAddress);

      const result = await getLocations();

      expect(result).toHaveLength(2);
      expect(result[0].name).toEqual('Test Location');
      expect(result[1].name).toEqual('Location No Address');
      
      // Verify all required fields are present
      result.forEach(location => {
        expect(location.id).toBeDefined();
        expect(location.name).toBeDefined();
        expect(location.branch_code).toBeDefined();
        expect(location.created_at).toBeInstanceOf(Date);
        expect(location.updated_at).toBeInstanceOf(Date);
      });
    });
  });

  describe('getLocationById', () => {
    it('should return null when location does not exist', async () => {
      const result = await getLocationById(999);

      expect(result).toBeNull();
    });

    it('should return location when it exists', async () => {
      const createdLocation = await createLocation(testLocationInput);

      const result = await getLocationById(createdLocation.id);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(createdLocation.id);
      expect(result!.name).toEqual('Test Location');
      expect(result!.branch_code).toEqual('TL001');
      expect(result!.address).toEqual('123 Test Street');
      expect(result!.created_at).toBeInstanceOf(Date);
      expect(result!.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('updateLocation', () => {
    let existingLocation: any;

    beforeEach(async () => {
      existingLocation = await createLocation(testLocationInput);
    });

    it('should update all fields when provided', async () => {
      const updateInput: UpdateLocationInput = {
        id: existingLocation.id,
        name: 'Updated Location',
        branch_code: 'UL001',
        address: '456 Updated Street'
      };

      const result = await updateLocation(updateInput);

      expect(result.id).toEqual(existingLocation.id);
      expect(result.name).toEqual('Updated Location');
      expect(result.branch_code).toEqual('UL001');
      expect(result.address).toEqual('456 Updated Street');
      expect(result.created_at).toEqual(existingLocation.created_at);
      expect(result.updated_at.getTime()).toBeGreaterThan(existingLocation.updated_at.getTime());
    });

    it('should update only provided fields', async () => {
      const updateInput: UpdateLocationInput = {
        id: existingLocation.id,
        name: 'Partially Updated'
      };

      const result = await updateLocation(updateInput);

      expect(result.name).toEqual('Partially Updated');
      expect(result.branch_code).toEqual('TL001'); // Should remain unchanged
      expect(result.address).toEqual('123 Test Street'); // Should remain unchanged
    });

    it('should update address to null', async () => {
      const updateInput: UpdateLocationInput = {
        id: existingLocation.id,
        address: null
      };

      const result = await updateLocation(updateInput);

      expect(result.address).toBeNull();
      expect(result.name).toEqual('Test Location'); // Should remain unchanged
    });

    it('should persist changes to database', async () => {
      const updateInput: UpdateLocationInput = {
        id: existingLocation.id,
        name: 'Database Updated'
      };

      await updateLocation(updateInput);

      const locations = await db.select()
        .from(locationsTable)
        .where(eq(locationsTable.id, existingLocation.id))
        .execute();

      expect(locations).toHaveLength(1);
      expect(locations[0].name).toEqual('Database Updated');
    });

    it('should throw error when location does not exist', async () => {
      const updateInput: UpdateLocationInput = {
        id: 999,
        name: 'Non-existent'
      };

      expect(updateLocation(updateInput)).rejects.toThrow(/Location with ID 999 not found/);
    });
  });

  describe('deleteLocation', () => {
    let existingLocation: any;

    beforeEach(async () => {
      existingLocation = await createLocation(testLocationInput);
    });

    it('should delete existing location', async () => {
      const result = await deleteLocation(existingLocation.id);

      expect(result).toBe(true);

      // Verify location is deleted from database
      const locations = await db.select()
        .from(locationsTable)
        .where(eq(locationsTable.id, existingLocation.id))
        .execute();

      expect(locations).toHaveLength(0);
    });

    it('should return false when location does not exist', async () => {
      const result = await deleteLocation(999);

      expect(result).toBe(false);
    });

    it('should not affect other locations', async () => {
      const otherLocation = await createLocation(testLocationInputWithNullAddress);

      await deleteLocation(existingLocation.id);

      const remainingLocations = await getLocations();
      expect(remainingLocations).toHaveLength(1);
      expect(remainingLocations[0].id).toEqual(otherLocation.id);
    });
  });


});