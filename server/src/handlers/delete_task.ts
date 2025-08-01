
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const deleteTaskInputSchema = z.object({
    id: z.number()
});

export type DeleteTaskInput = z.infer<typeof deleteTaskInputSchema>;

export async function deleteTask(input: DeleteTaskInput): Promise<{ success: boolean }> {
    try {
        const result = await db.delete(tasksTable)
            .where(eq(tasksTable.id, input.id))
            .returning()
            .execute();

        // If no rows were affected, the task didn't exist
        return { success: result.length > 0 };
    } catch (error) {
        console.error('Task deletion failed:', error);
        throw error;
    }
}
