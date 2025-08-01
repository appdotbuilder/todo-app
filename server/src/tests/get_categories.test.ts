
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();

    expect(result).toEqual([]);
  });

  it('should return all categories', async () => {
    // Create test categories
    await db.insert(categoriesTable)
      .values([
        { name: 'Work', color: '#ff0000' },
        { name: 'Personal', color: '#00ff00' },
        { name: 'Shopping', color: null }
      ])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Work');
    expect(result[0].color).toEqual('#ff0000');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Personal');
    expect(result[1].color).toEqual('#00ff00');

    expect(result[2].name).toEqual('Shopping');
    expect(result[2].color).toBeNull();
  });

  it('should return categories ordered by creation order', async () => {
    // Create categories with specific names to verify order
    await db.insert(categoriesTable)
      .values({ name: 'First Category', color: '#111111' })
      .execute();

    await db.insert(categoriesTable)
      .values({ name: 'Second Category', color: '#222222' })
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('First Category');
    expect(result[1].name).toEqual('Second Category');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
