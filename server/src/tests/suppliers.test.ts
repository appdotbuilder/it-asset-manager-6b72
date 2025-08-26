import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { type CreateSupplierInput, type UpdateSupplierInput } from '../schema';
import { 
  getSuppliers, 
  getSupplierById, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier 
} from '../handlers/suppliers';
import { eq } from 'drizzle-orm';

// Test input data
const testSupplierInput: CreateSupplierInput = {
  name: 'Test Supplier Co.',
  contact_person: 'John Doe',
  phone_number: '+1-555-0123',
  address: '123 Test Street, Test City, TC 12345'
};

const minimalSupplierInput: CreateSupplierInput = {
  name: 'Minimal Supplier',
  contact_person: null,
  phone_number: null,
  address: null
};

describe('Suppliers Handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createSupplier', () => {
    it('should create a supplier with all fields', async () => {
      const result = await createSupplier(testSupplierInput);

      expect(result.id).toBeDefined();
      expect(result.name).toEqual('Test Supplier Co.');
      expect(result.contact_person).toEqual('John Doe');
      expect(result.phone_number).toEqual('+1-555-0123');
      expect(result.address).toEqual('123 Test Street, Test City, TC 12345');
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create a supplier with minimal fields', async () => {
      const result = await createSupplier(minimalSupplierInput);

      expect(result.id).toBeDefined();
      expect(result.name).toEqual('Minimal Supplier');
      expect(result.contact_person).toBeNull();
      expect(result.phone_number).toBeNull();
      expect(result.address).toBeNull();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save supplier to database', async () => {
      const result = await createSupplier(testSupplierInput);

      const suppliers = await db.select()
        .from(suppliersTable)
        .where(eq(suppliersTable.id, result.id))
        .execute();

      expect(suppliers).toHaveLength(1);
      expect(suppliers[0].name).toEqual('Test Supplier Co.');
      expect(suppliers[0].contact_person).toEqual('John Doe');
      expect(suppliers[0].phone_number).toEqual('+1-555-0123');
      expect(suppliers[0].address).toEqual('123 Test Street, Test City, TC 12345');
    });
  });

  describe('getSuppliers', () => {
    it('should return empty array when no suppliers exist', async () => {
      const result = await getSuppliers();
      expect(result).toEqual([]);
    });

    it('should return all suppliers', async () => {
      // Create test suppliers
      const supplier1 = await createSupplier(testSupplierInput);
      const supplier2 = await createSupplier(minimalSupplierInput);

      const result = await getSuppliers();

      expect(result).toHaveLength(2);
      expect(result.find(s => s.id === supplier1.id)).toBeDefined();
      expect(result.find(s => s.id === supplier2.id)).toBeDefined();
    });

    it('should return suppliers with correct data types', async () => {
      await createSupplier(testSupplierInput);

      const result = await getSuppliers();

      expect(result).toHaveLength(1);
      const supplier = result[0];
      expect(typeof supplier.id).toBe('number');
      expect(typeof supplier.name).toBe('string');
      expect(supplier.created_at).toBeInstanceOf(Date);
      expect(supplier.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('getSupplierById', () => {
    it('should return null for non-existent supplier', async () => {
      const result = await getSupplierById(999);
      expect(result).toBeNull();
    });

    it('should return supplier by ID', async () => {
      const created = await createSupplier(testSupplierInput);

      const result = await getSupplierById(created.id);

      expect(result).toBeDefined();
      expect(result!.id).toEqual(created.id);
      expect(result!.name).toEqual('Test Supplier Co.');
      expect(result!.contact_person).toEqual('John Doe');
      expect(result!.phone_number).toEqual('+1-555-0123');
      expect(result!.address).toEqual('123 Test Street, Test City, TC 12345');
    });

    it('should return supplier with correct data types', async () => {
      const created = await createSupplier(testSupplierInput);

      const result = await getSupplierById(created.id);

      expect(result).toBeDefined();
      expect(typeof result!.id).toBe('number');
      expect(typeof result!.name).toBe('string');
      expect(result!.created_at).toBeInstanceOf(Date);
      expect(result!.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('updateSupplier', () => {
    it('should update all fields', async () => {
      const created = await createSupplier(testSupplierInput);

      const updateInput: UpdateSupplierInput = {
        id: created.id,
        name: 'Updated Supplier Name',
        contact_person: 'Jane Smith',
        phone_number: '+1-555-9999',
        address: '456 Updated Ave, New City, NC 54321'
      };

      const result = await updateSupplier(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('Updated Supplier Name');
      expect(result.contact_person).toEqual('Jane Smith');
      expect(result.phone_number).toEqual('+1-555-9999');
      expect(result.address).toEqual('456 Updated Ave, New City, NC 54321');
      expect(result.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
    });

    it('should update partial fields', async () => {
      const created = await createSupplier(testSupplierInput);

      const updateInput: UpdateSupplierInput = {
        id: created.id,
        name: 'Partially Updated Supplier'
      };

      const result = await updateSupplier(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('Partially Updated Supplier');
      expect(result.contact_person).toEqual('John Doe'); // Should remain unchanged
      expect(result.phone_number).toEqual('+1-555-0123'); // Should remain unchanged
      expect(result.address).toEqual('123 Test Street, Test City, TC 12345'); // Should remain unchanged
    });

    it('should update nullable fields to null', async () => {
      const created = await createSupplier(testSupplierInput);

      const updateInput: UpdateSupplierInput = {
        id: created.id,
        contact_person: null,
        phone_number: null,
        address: null
      };

      const result = await updateSupplier(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('Test Supplier Co.'); // Should remain unchanged
      expect(result.contact_person).toBeNull();
      expect(result.phone_number).toBeNull();
      expect(result.address).toBeNull();
    });

    it('should save updates to database', async () => {
      const created = await createSupplier(testSupplierInput);

      const updateInput: UpdateSupplierInput = {
        id: created.id,
        name: 'Database Updated Supplier'
      };

      await updateSupplier(updateInput);

      const suppliers = await db.select()
        .from(suppliersTable)
        .where(eq(suppliersTable.id, created.id))
        .execute();

      expect(suppliers).toHaveLength(1);
      expect(suppliers[0].name).toEqual('Database Updated Supplier');
    });

    it('should throw error for non-existent supplier', async () => {
      const updateInput: UpdateSupplierInput = {
        id: 999,
        name: 'Non-existent Supplier'
      };

      await expect(updateSupplier(updateInput)).rejects.toThrow(/not found/i);
    });
  });

  describe('deleteSupplier', () => {
    it('should return false for non-existent supplier', async () => {
      const result = await deleteSupplier(999);
      expect(result).toBe(false);
    });

    it('should delete existing supplier', async () => {
      const created = await createSupplier(testSupplierInput);

      const result = await deleteSupplier(created.id);

      expect(result).toBe(true);

      // Verify supplier is deleted from database
      const suppliers = await db.select()
        .from(suppliersTable)
        .where(eq(suppliersTable.id, created.id))
        .execute();

      expect(suppliers).toHaveLength(0);
    });

    it('should not affect other suppliers', async () => {
      const supplier1 = await createSupplier(testSupplierInput);
      const supplier2 = await createSupplier(minimalSupplierInput);

      await deleteSupplier(supplier1.id);

      // Verify supplier2 still exists
      const remaining = await getSupplierById(supplier2.id);
      expect(remaining).toBeDefined();
      expect(remaining!.id).toEqual(supplier2.id);
    });
  });
});