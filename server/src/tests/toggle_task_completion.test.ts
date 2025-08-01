
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, categoriesTable } from '../db/schema';
import { type ToggleTaskCompletionInput } from '../handlers/toggle_task_completion';
import { toggleTaskCompletion } from '../handlers/toggle_task_completion';
import { eq } from 'drizzle-orm';

describe('toggleTaskCompletion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should toggle task completion from false to true', async () => {
    // Create a task that is not completed
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A task for testing',
        completed: false,
        priority: 'medium'
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;
    const input: ToggleTaskCompletionInput = { id: taskId };

    const result = await toggleTaskCompletion(input);

    expect(result.id).toEqual(taskId);
    expect(result.completed).toBe(true);
    expect(result.title).toEqual('Test Task');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should toggle task completion from true to false', async () => {
    // Create a task that is completed
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: 'A completed task',
        completed: true,
        priority: 'high'
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;
    const input: ToggleTaskCompletionInput = { id: taskId };

    const result = await toggleTaskCompletion(input);

    expect(result.id).toEqual(taskId);
    expect(result.completed).toBe(false);
    expect(result.title).toEqual('Completed Task');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update the task in the database', async () => {
    // Create a task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Database Test Task',
        completed: false,
        priority: 'low'
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;
    const input: ToggleTaskCompletionInput = { id: taskId };

    await toggleTaskCompletion(input);

    // Verify the task was updated in the database
    const updatedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(updatedTasks).toHaveLength(1);
    expect(updatedTasks[0].completed).toBe(true);
    expect(updatedTasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent task', async () => {
    const input: ToggleTaskCompletionInput = { id: 999 };

    await expect(toggleTaskCompletion(input)).rejects.toThrow(/task with id 999 not found/i);
  });

  it('should work with tasks that have categories', async () => {
    // Create a category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Work',
        color: '#ff0000'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create a task with category
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Work Task',
        completed: false,
        priority: 'medium',
        category_id: categoryId
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;
    const input: ToggleTaskCompletionInput = { id: taskId };

    const result = await toggleTaskCompletion(input);

    expect(result.id).toEqual(taskId);
    expect(result.completed).toBe(true);
    expect(result.category_id).toEqual(categoryId);
  });
});
