
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput, type Task } from '../schema';

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  try {
    // Insert task record
    const result = await db.insert(tasksTable)
      .values({
        title: input.title,
        description: input.description || null,
        due_date: input.due_date || null,
        priority: input.priority, // Zod default 'medium' is already applied
        category_id: input.category_id || null
      })
      .returning()
      .execute();

    const task = result[0];
    return {
      ...task,
      // Ensure dates are Date objects
      due_date: task.due_date || null,
      created_at: task.created_at,
      updated_at: task.updated_at
    };
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
};
