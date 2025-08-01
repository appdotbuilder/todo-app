
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, categoriesTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing',
  due_date: new Date('2024-12-31'),
  priority: 'high',
  category_id: null
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with all fields', async () => {
    const result = await createTask(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.due_date?.toISOString()).toEqual('2024-12-31T00:00:00.000Z');
    expect(result.completed).toEqual(false);
    expect(result.priority).toEqual('high');
    expect(result.category_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task with minimal fields (using defaults)', async () => {
    const minimalInput: CreateTaskInput = {
      title: 'Minimal Task',
      priority: 'medium' // Include required field
    };

    const result = await createTask(minimalInput);

    expect(result.title).toEqual('Minimal Task');
    expect(result.description).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.priority).toEqual('medium');
    expect(result.category_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(testInput);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].description).toEqual('A task for testing');
    expect(tasks[0].due_date).toBeInstanceOf(Date);
    expect(tasks[0].completed).toEqual(false);
    expect(tasks[0].priority).toEqual('high');
    expect(tasks[0].category_id).toBeNull();
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create task with valid category_id', async () => {
    // First create a category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#ff0000'
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    const taskInput: CreateTaskInput = {
      title: 'Categorized Task',
      priority: 'medium', // Include required field
      category_id: category.id
    };

    const result = await createTask(taskInput);

    expect(result.title).toEqual('Categorized Task');
    expect(result.category_id).toEqual(category.id);
    expect(result.priority).toEqual('medium');

    // Verify in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks[0].category_id).toEqual(category.id);
  });

  it('should handle different priority levels', async () => {
    const lowPriorityInput: CreateTaskInput = {
      title: 'Low Priority Task',
      priority: 'low'
    };

    const result = await createTask(lowPriorityInput);

    expect(result.priority).toEqual('low');
    expect(result.title).toEqual('Low Priority Task');

    // Verify in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks[0].priority).toEqual('low');
  });
});
