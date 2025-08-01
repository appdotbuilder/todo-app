
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';
import { eq } from 'drizzle-orm';

export type ToggleTaskCompletionInput = {
  id: number;
};

export const toggleTaskCompletion = async (input: ToggleTaskCompletionInput): Promise<Task> => {
  try {
    // First, get the current task to check its completion status
    const existingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    if (existingTasks.length === 0) {
      throw new Error(`Task with id ${input.id} not found`);
    }

    const currentTask = existingTasks[0];

    // Toggle the completion status and update the task
    const result = await db.update(tasksTable)
      .set({
        completed: !currentTask.completed,
        updated_at: new Date()
      })
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Task completion toggle failed:', error);
    throw error;
  }
};
