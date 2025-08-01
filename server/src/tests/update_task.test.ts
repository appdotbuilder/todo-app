
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, categoriesTable } from '../db/schema';
import { type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a task directly in the database
  const createTestTask = async (data: {
    title: string;
    description?: string | null;
    due_date?: Date | null;
    completed?: boolean;
    priority?: 'low' | 'medium' | 'high';
    category_id?: number | null;
  }) => {
    const result = await db.insert(tasksTable)
      .values({
        title: data.title,
        description: data.description || null,
        due_date: data.due_date || null,
        completed: data.completed || false,
        priority: data.priority || 'medium',
        category_id: data.category_id || null
      })
      .returning()
      .execute();
    
    return result[0];
  };

  // Helper function to create a category directly in the database
  const createTestCategory = async (name: string, color?: string | null) => {
    const result = await db.insert(categoriesTable)
      .values({
        name: name,
        color: color || null
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should update task title', async () => {
    // Create initial task
    const task = await createTestTask({
      title: 'Original Task',
      description: 'Original description',
      priority: 'low'
    });

    // Update the task
    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Updated Task Title'
    };
    const result = await updateTask(updateInput);

    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Updated Task Title');
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.priority).toEqual('low'); // Unchanged
    expect(result.completed).toEqual(false); // Default unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > task.created_at).toBe(true);
  });

  it('should mark task as completed', async () => {
    // Create initial task
    const task = await createTestTask({
      title: 'Task to Complete',
      priority: 'high'
    });

    // Mark as completed
    const updateInput: UpdateTaskInput = {
      id: task.id,
      completed: true
    };
    const result = await updateTask(updateInput);

    expect(result.completed).toBe(true);
    expect(result.title).toEqual('Task to Complete'); // Unchanged
    expect(result.priority).toEqual('high'); // Unchanged
  });

  it('should update multiple fields at once', async () => {
    // Create category first
    const category = await createTestCategory('Work', '#FF0000');

    // Create initial task
    const task = await createTestTask({
      title: 'Multi-field Task',
      description: 'Original description',
      priority: 'low'
    });

    // Update multiple fields
    const dueDate = new Date('2024-12-31');
    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Updated Multi-field Task',
      description: 'Updated description',
      due_date: dueDate,
      completed: true,
      priority: 'high',
      category_id: category.id
    };
    const result = await updateTask(updateInput);

    expect(result.title).toEqual('Updated Multi-field Task');
    expect(result.description).toEqual('Updated description');
    expect(result.due_date).toEqual(dueDate);
    expect(result.completed).toBe(true);
    expect(result.priority).toEqual('high');
    expect(result.category_id).toEqual(category.id);
  });

  it('should set nullable fields to null', async () => {
    // Create initial task with values
    const task = await createTestTask({
      title: 'Task with Values',
      description: 'Some description'
    });

    // Update to null values
    const updateInput: UpdateTaskInput = {
      id: task.id,
      description: null,
      due_date: null,
      category_id: null
    };
    const result = await updateTask(updateInput);

    expect(result.description).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.category_id).toBeNull();
    expect(result.title).toEqual('Task with Values'); // Unchanged
  });

  it('should save changes to database', async () => {
    // Create initial task
    const task = await createTestTask({
      title: 'Database Test Task',
      priority: 'medium'
    });

    // Update the task
    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Updated Database Task',
      completed: true
    };
    await updateTask(updateInput);

    // Verify changes in database
    const savedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();

    expect(savedTasks).toHaveLength(1);
    expect(savedTasks[0].title).toEqual('Updated Database Task');
    expect(savedTasks[0].completed).toBe(true);
    expect(savedTasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent task', async () => {
    const updateInput: UpdateTaskInput = {
      id: 99999,
      title: 'Non-existent Task'
    };

    await expect(updateTask(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update only provided fields', async () => {
    // Create category first
    const category = await createTestCategory('Original Category');

    // Create initial task with all fields
    const task = await createTestTask({
      title: 'Full Task',
      description: 'Full description',
      due_date: new Date('2024-01-01'),
      priority: 'low',
      category_id: category.id
    });

    // Update only priority
    const updateInput: UpdateTaskInput = {
      id: task.id,
      priority: 'high'
    };
    const result = await updateTask(updateInput);

    // Only priority should change
    expect(result.priority).toEqual('high');
    expect(result.title).toEqual('Full Task');
    expect(result.description).toEqual('Full description');
    expect(result.due_date).toEqual(new Date('2024-01-01'));
    expect(result.category_id).toEqual(category.id);
    expect(result.completed).toBe(false);
  });
});
