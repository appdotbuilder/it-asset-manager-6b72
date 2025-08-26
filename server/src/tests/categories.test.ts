import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput, type UpdateCategoryInput } from '../schema';
import { 
  getCategories, 
  getCategoryById, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../handlers/categories';
import { eq } from 'drizzle-orm';

describe('categories handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createCategory', () => {
    it('should create a category with all fields', async () => {
      const input: CreateCategoryInput = {
        name: 'Electronics',
        description: 'Electronic devices and components'
      };

      const result = await createCategory(input);

      expect(result.name).toEqual('Electronics');
      expect(result.description).toEqual('Electronic devices and components');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create a category with null description', async () => {
      const input: CreateCategoryInput = {
        name: 'Office Supplies',
        description: null
      };

      const result = await createCategory(input);

      expect(result.name).toEqual('Office Supplies');
      expect(result.description).toBeNull();
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save category to database', async () => {
      const input: CreateCategoryInput = {
        name: 'Furniture',
        description: 'Office and home furniture'
      };

      const result = await createCategory(input);

      const categories = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, result.id))
        .execute();

      expect(categories).toHaveLength(1);
      expect(categories[0].name).toEqual('Furniture');
      expect(categories[0].description).toEqual('Office and home furniture');
    });
  });

  describe('getCategories', () => {
    it('should return empty array when no categories exist', async () => {
      const result = await getCategories();

      expect(result).toEqual([]);
    });

    it('should return all categories', async () => {
      // Create test categories
      await createCategory({
        name: 'Electronics',
        description: 'Electronic devices'
      });

      await createCategory({
        name: 'Furniture',
        description: null
      });

      const result = await getCategories();

      expect(result).toHaveLength(2);
      expect(result[0].name).toEqual('Electronics');
      expect(result[0].description).toEqual('Electronic devices');
      expect(result[1].name).toEqual('Furniture');
      expect(result[1].description).toBeNull();
    });

    it('should return categories with proper date types', async () => {
      await createCategory({
        name: 'Test Category',
        description: 'Test description'
      });

      const result = await getCategories();

      expect(result).toHaveLength(1);
      expect(result[0].created_at).toBeInstanceOf(Date);
      expect(result[0].updated_at).toBeInstanceOf(Date);
    });
  });

  describe('getCategoryById', () => {
    it('should return null for non-existent category', async () => {
      const result = await getCategoryById(999);

      expect(result).toBeNull();
    });

    it('should return category by ID', async () => {
      const created = await createCategory({
        name: 'Test Category',
        description: 'Test description'
      });

      const result = await getCategoryById(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.name).toEqual('Test Category');
      expect(result!.description).toEqual('Test description');
      expect(result!.created_at).toBeInstanceOf(Date);
      expect(result!.updated_at).toBeInstanceOf(Date);
    });

    it('should return category with null description', async () => {
      const created = await createCategory({
        name: 'Minimal Category',
        description: null
      });

      const result = await getCategoryById(created.id);

      expect(result).not.toBeNull();
      expect(result!.name).toEqual('Minimal Category');
      expect(result!.description).toBeNull();
    });
  });

  describe('updateCategory', () => {
    it('should update category name only', async () => {
      const created = await createCategory({
        name: 'Original Name',
        description: 'Original description'
      });

      const updateInput: UpdateCategoryInput = {
        id: created.id,
        name: 'Updated Name'
      };

      const result = await updateCategory(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('Updated Name');
      expect(result.description).toEqual('Original description'); // Should remain unchanged
      expect(result.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
    });

    it('should update category description only', async () => {
      const created = await createCategory({
        name: 'Test Category',
        description: 'Original description'
      });

      const updateInput: UpdateCategoryInput = {
        id: created.id,
        description: 'Updated description'
      };

      const result = await updateCategory(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('Test Category'); // Should remain unchanged
      expect(result.description).toEqual('Updated description');
      expect(result.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
    });

    it('should update both name and description', async () => {
      const created = await createCategory({
        name: 'Original Name',
        description: 'Original description'
      });

      const updateInput: UpdateCategoryInput = {
        id: created.id,
        name: 'Updated Name',
        description: 'Updated description'
      };

      const result = await updateCategory(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('Updated Name');
      expect(result.description).toEqual('Updated description');
      expect(result.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
    });

    it('should set description to null', async () => {
      const created = await createCategory({
        name: 'Test Category',
        description: 'Original description'
      });

      const updateInput: UpdateCategoryInput = {
        id: created.id,
        description: null
      };

      const result = await updateCategory(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('Test Category');
      expect(result.description).toBeNull();
    });

    it('should persist changes to database', async () => {
      const created = await createCategory({
        name: 'Original Name',
        description: 'Original description'
      });

      await updateCategory({
        id: created.id,
        name: 'Updated Name',
        description: 'Updated description'
      });

      const fromDb = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, created.id))
        .execute();

      expect(fromDb).toHaveLength(1);
      expect(fromDb[0].name).toEqual('Updated Name');
      expect(fromDb[0].description).toEqual('Updated description');
      expect(fromDb[0].updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
    });

    it('should throw error for non-existent category', async () => {
      const updateInput: UpdateCategoryInput = {
        id: 999,
        name: 'Non-existent Category'
      };

      expect(updateCategory(updateInput)).rejects.toThrow(/not found/i);
    });
  });

  describe('deleteCategory', () => {
    it('should return false for non-existent category', async () => {
      const result = await deleteCategory(999);

      expect(result).toBe(false);
    });

    it('should delete existing category and return true', async () => {
      const created = await createCategory({
        name: 'Category to Delete',
        description: 'Will be deleted'
      });

      const result = await deleteCategory(created.id);

      expect(result).toBe(true);

      // Verify category is deleted
      const fromDb = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, created.id))
        .execute();

      expect(fromDb).toHaveLength(0);
    });

    it('should remove category from database', async () => {
      const created1 = await createCategory({
        name: 'Category 1',
        description: 'First category'
      });

      const created2 = await createCategory({
        name: 'Category 2',
        description: 'Second category'
      });

      await deleteCategory(created1.id);

      // Verify only one category remains
      const allCategories = await db.select()
        .from(categoriesTable)
        .execute();

      expect(allCategories).toHaveLength(1);
      expect(allCategories[0].id).toEqual(created2.id);
      expect(allCategories[0].name).toEqual('Category 2');
    });
  });
});