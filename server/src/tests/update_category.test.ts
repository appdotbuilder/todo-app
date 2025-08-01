
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput, type UpdateCategoryInput } from '../schema';
import { updateCategory } from '../handlers/update_category';
import { eq } from 'drizzle-orm';

describe('updateCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update category name', async () => {
    // Create a category first
    const createResult = await db.insert(categoriesTable)
      .values({
        name: 'Original Category',
        color: '#ff0000'
      })
      .returning()
      .execute();

    const categoryId = createResult[0].id;

    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      name: 'Updated Category'
    };

    const result = await updateCategory(updateInput);

    expect(result.id).toEqual(categoryId);
    expect(result.name).toEqual('Updated Category');
    expect(result.color).toEqual('#ff0000'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update category color', async () => {
    // Create a category first
    const createResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#ff0000'
      })
      .returning()
      .execute();

    const categoryId = createResult[0].id;

    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      color: '#00ff00'
    };

    const result = await updateCategory(updateInput);

    expect(result.id).toEqual(categoryId);
    expect(result.name).toEqual('Test Category'); // Should remain unchanged
    expect(result.color).toEqual('#00ff00');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update both name and color', async () => {
    // Create a category first
    const createResult = await db.insert(categoriesTable)
      .values({
        name: 'Original Category',
        color: '#ff0000'
      })
      .returning()
      .execute();

    const categoryId = createResult[0].id;

    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      name: 'Updated Category',
      color: '#00ff00'
    };

    const result = await updateCategory(updateInput);

    expect(result.id).toEqual(categoryId);
    expect(result.name).toEqual('Updated Category');
    expect(result.color).toEqual('#00ff00');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should set color to null', async () => {
    // Create a category first
    const createResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#ff0000'
      })
      .returning()
      .execute();

    const categoryId = createResult[0].id;

    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      color: null
    };

    const result = await updateCategory(updateInput);

    expect(result.id).toEqual(categoryId);
    expect(result.name).toEqual('Test Category'); // Should remain unchanged
    expect(result.color).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    // Create a category first
    const createResult = await db.insert(categoriesTable)
      .values({
        name: 'Original Category',
        color: '#ff0000'
      })
      .returning()
      .execute();

    const categoryId = createResult[0].id;

    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      name: 'Updated Category',
      color: '#00ff00'
    };

    await updateCategory(updateInput);

    // Query database to verify changes were saved
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Updated Category');
    expect(categories[0].color).toEqual('#00ff00');
  });

  it('should throw error for non-existent category', async () => {
    const updateInput: UpdateCategoryInput = {
      id: 999,
      name: 'Non-existent Category'
    };

    await expect(updateCategory(updateInput)).rejects.toThrow(/category with id 999 not found/i);
  });
});
