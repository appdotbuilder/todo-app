
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, categoriesTable } from '../db/schema';
import { type DeleteTaskInput } from '../handlers/delete_task';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

describe('deleteTask', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should delete an existing task', async () => {
        // Create test category first
        const categoryResult = await db.insert(categoriesTable)
            .values({
                name: 'Test Category',
                color: '#FF0000'
            })
            .returning()
            .execute();

        // Create test task
        const taskResult = await db.insert(tasksTable)
            .values({
                title: 'Test Task',
                description: 'A task to be deleted',
                priority: 'medium',
                completed: false,
                category_id: categoryResult[0].id
            })
            .returning()
            .execute();

        const taskId = taskResult[0].id;

        // Delete the task
        const result = await deleteTask({ id: taskId });

        // Should return success
        expect(result.success).toBe(true);

        // Verify task was actually deleted from database
        const tasks = await db.select()
            .from(tasksTable)
            .where(eq(tasksTable.id, taskId))
            .execute();

        expect(tasks).toHaveLength(0);
    });

    it('should return false when deleting non-existent task', async () => {
        const nonExistentId = 99999;

        const result = await deleteTask({ id: nonExistentId });

        // Should return success false since no task was deleted
        expect(result.success).toBe(false);
    });

    it('should delete task without category', async () => {
        // Create test task without category
        const taskResult = await db.insert(tasksTable)
            .values({
                title: 'Task Without Category',
                description: 'No category assigned',
                priority: 'high',
                completed: true,
                category_id: null
            })
            .returning()
            .execute();

        const taskId = taskResult[0].id;

        // Delete the task
        const result = await deleteTask({ id: taskId });

        // Should return success
        expect(result.success).toBe(true);

        // Verify task was deleted
        const tasks = await db.select()
            .from(tasksTable)
            .where(eq(tasksTable.id, taskId))
            .execute();

        expect(tasks).toHaveLength(0);
    });

    it('should not affect other tasks when deleting one task', async () => {
        // Create multiple test tasks
        const taskResults = await db.insert(tasksTable)
            .values([
                {
                    title: 'Task 1',
                    description: 'First task',
                    priority: 'low',
                    completed: false
                },
                {
                    title: 'Task 2', 
                    description: 'Second task',
                    priority: 'medium',
                    completed: false
                }
            ])
            .returning()
            .execute();

        const taskToDelete = taskResults[0].id;
        const taskToKeep = taskResults[1].id;

        // Delete only the first task
        const result = await deleteTask({ id: taskToDelete });

        expect(result.success).toBe(true);

        // Verify only the intended task was deleted
        const deletedTask = await db.select()
            .from(tasksTable)
            .where(eq(tasksTable.id, taskToDelete))
            .execute();
        expect(deletedTask).toHaveLength(0);

        // Verify the other task still exists
        const remainingTask = await db.select()
            .from(tasksTable)
            .where(eq(tasksTable.id, taskToKeep))
            .execute();
        expect(remainingTask).toHaveLength(1);
        expect(remainingTask[0].title).toBe('Task 2');
    });
});
