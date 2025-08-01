
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateCategoryInput = {
  name: 'Test Category',
  color: '#FF5733'
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category with color', async () => {
    const result = await createCategory(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Category');
    expect(result.color).toEqual('#FF5733');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a category without color', async () => {
    const inputWithoutColor: CreateCategoryInput = {
      name: 'No Color Category'
    };

    const result = await createCategory(inputWithoutColor);

    expect(result.name).toEqual('No Color Category');
    expect(result.color).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    const result = await createCategory(testInput);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Test Category');
    expect(categories[0].color).toEqual('#FF5733');
    expect(categories[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null color correctly', async () => {
    const inputWithNullColor: CreateCategoryInput = {
      name: 'Null Color Category',
      color: null
    };

    const result = await createCategory(inputWithNullColor);

    expect(result.name).toEqual('Null Color Category');
    expect(result.color).toBeNull();

    // Verify in database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories[0].color).toBeNull();
  });
});
