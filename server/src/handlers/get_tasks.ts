
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task, type GetTasksFilter } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export async function getTasks(filter?: GetTasksFilter): Promise<Task[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter?.completed !== undefined) {
      conditions.push(eq(tasksTable.completed, filter.completed));
    }

    if (filter?.category_id !== undefined) {
      conditions.push(eq(tasksTable.category_id, filter.category_id));
    }

    if (filter?.priority !== undefined) {
      conditions.push(eq(tasksTable.priority, filter.priority));
    }

    // Build and execute query based on whether we have conditions
    const results = conditions.length > 0
      ? await db.select()
          .from(tasksTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .execute()
      : await db.select()
          .from(tasksTable)
          .execute();

    return results;
  } catch (error) {
    console.error('Failed to get tasks:', error);
    throw error;
  }
}
