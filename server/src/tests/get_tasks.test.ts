
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, categoriesTable } from '../db/schema';
import { type CreateTaskInput, type CreateCategoryInput, type GetTasksFilter } from '../schema';
import { getTasks } from '../handlers/get_tasks';

// Test data
const testCategory: CreateCategoryInput = {
  name: 'Work',
  color: '#ff0000'
};

const testTask1: CreateTaskInput = {
  title: 'Complete project',
  description: 'Finish the important project',
  due_date: new Date('2024-12-31'),
  priority: 'high',
  category_id: undefined // Will be set after category creation
};

const testTask2: CreateTaskInput = {
  title: 'Review documents',
  description: 'Review the quarterly reports',
  due_date: new Date('2024-12-15'),
  priority: 'medium',
  category_id: undefined // Will be set after category creation
};

const testTask3: CreateTaskInput = {
  title: 'Personal task',
  description: 'Buy groceries',
  due_date: null,
  priority: 'low',
  category_id: null
};

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all tasks when no filter is provided', async () => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create test tasks
    await db.insert(tasksTable)
      .values([
        { ...testTask1, category_id: categoryId },
        { ...testTask2, category_id: categoryId },
        testTask3
      ])
      .execute();

    const results = await getTasks();

    expect(results).toHaveLength(3);
    expect(results.some(task => task.title === 'Complete project')).toBe(true);
    expect(results.some(task => task.title === 'Review documents')).toBe(true);
    expect(results.some(task => task.title === 'Personal task')).toBe(true);
  });

  it('should filter tasks by completion status', async () => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create tasks - one completed, two incomplete
    await db.insert(tasksTable)
      .values([
        { ...testTask1, category_id: categoryId, completed: true },
        { ...testTask2, category_id: categoryId, completed: false },
        { ...testTask3, completed: false }
      ])
      .execute();

    const filter: GetTasksFilter = { completed: true };
    const results = await getTasks(filter);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Complete project');
    expect(results[0].completed).toBe(true);
  });

  it('should filter tasks by category_id', async () => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create tasks - two with category, one without
    await db.insert(tasksTable)
      .values([
        { ...testTask1, category_id: categoryId },
        { ...testTask2, category_id: categoryId },
        testTask3 // no category
      ])
      .execute();

    const filter: GetTasksFilter = { category_id: categoryId };
    const results = await getTasks(filter);

    expect(results).toHaveLength(2);
    expect(results.every(task => task.category_id === categoryId)).toBe(true);
    expect(results.some(task => task.title === 'Complete project')).toBe(true);
    expect(results.some(task => task.title === 'Review documents')).toBe(true);
  });

  it('should filter tasks by priority', async () => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create tasks with different priorities
    await db.insert(tasksTable)
      .values([
        { ...testTask1, category_id: categoryId }, // high priority
        { ...testTask2, category_id: categoryId }, // medium priority
        testTask3 // low priority
      ])
      .execute();

    const filter: GetTasksFilter = { priority: 'high' };
    const results = await getTasks(filter);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Complete project');
    expect(results[0].priority).toBe('high');
  });

  it('should filter tasks by multiple criteria', async () => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create tasks with various combinations
    await db.insert(tasksTable)
      .values([
        { ...testTask1, category_id: categoryId, completed: true }, // high, completed, with category
        { ...testTask2, category_id: categoryId, completed: false }, // medium, incomplete, with category
        { ...testTask3, completed: false } // low, incomplete, no category
      ])
      .execute();

    const filter: GetTasksFilter = { 
      completed: false, 
      category_id: categoryId 
    };
    const results = await getTasks(filter);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Review documents');
    expect(results[0].completed).toBe(false);
    expect(results[0].category_id).toBe(categoryId);
  });

  it('should return empty array when no tasks match filter', async () => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create only incomplete tasks
    await db.insert(tasksTable)
      .values([
        { ...testTask1, category_id: categoryId, completed: false },
        { ...testTask2, category_id: categoryId, completed: false }
      ])
      .execute();

    const filter: GetTasksFilter = { completed: true };
    const results = await getTasks(filter);

    expect(results).toHaveLength(0);
  });

  it('should return empty array when no tasks exist', async () => {
    const results = await getTasks();
    expect(results).toHaveLength(0);
  });
});
