
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, tasksTable } from '../db/schema';
import { type DeleteCategoryInput } from '../handlers/delete_category';
import { deleteCategory } from '../handlers/delete_category';
import { eq } from 'drizzle-orm';

describe('deleteCategory', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should delete an existing category', async () => {
        // Create a test category
        const categoryResult = await db.insert(categoriesTable)
            .values({
                name: 'Test Category',
                color: '#ff0000'
            })
            .returning()
            .execute();

        const categoryId = categoryResult[0].id;

        const input: DeleteCategoryInput = {
            id: categoryId
        };

        const result = await deleteCategory(input);

        expect(result.success).toBe(true);

        // Verify category was deleted
        const deletedCategories = await db.select()
            .from(categoriesTable)
            .where(eq(categoriesTable.id, categoryId))
            .execute();

        expect(deletedCategories).toHaveLength(0);
    });

    it('should throw error when category does not exist', async () => {
        const input: DeleteCategoryInput = {
            id: 999
        };

        expect(deleteCategory(input)).rejects.toThrow(/category not found/i);
    });

    it('should prevent deletion of category with assigned tasks', async () => {
        // Create a test category
        const categoryResult = await db.insert(categoriesTable)
            .values({
                name: 'Category with Tasks',
                color: '#00ff00'
            })
            .returning()
            .execute();

        const categoryId = categoryResult[0].id;

        // Create a task assigned to this category
        await db.insert(tasksTable)
            .values({
                title: 'Test Task',
                description: 'A task in the category',
                priority: 'medium',
                category_id: categoryId
            })
            .execute();

        const input: DeleteCategoryInput = {
            id: categoryId
        };

        expect(deleteCategory(input)).rejects.toThrow(/cannot delete category with assigned tasks/i);

        // Verify category still exists
        const existingCategories = await db.select()
            .from(categoriesTable)
            .where(eq(categoriesTable.id, categoryId))
            .execute();

        expect(existingCategories).toHaveLength(1);
    });

    it('should allow deletion of category after tasks are unassigned', async () => {
        // Create a test category
        const categoryResult = await db.insert(categoriesTable)
            .values({
                name: 'Category to Delete',
                color: '#0000ff'
            })
            .returning()
            .execute();

        const categoryId = categoryResult[0].id;

        // Create a task assigned to this category
        const taskResult = await db.insert(tasksTable)
            .values({
                title: 'Test Task',
                description: 'A task in the category',
                priority: 'high',
                category_id: categoryId
            })
            .returning()
            .execute();

        // Unassign the task from the category
        await db.update(tasksTable)
            .set({ category_id: null })
            .where(eq(tasksTable.id, taskResult[0].id))
            .execute();

        const input: DeleteCategoryInput = {
            id: categoryId
        };

        const result = await deleteCategory(input);

        expect(result.success).toBe(true);

        // Verify category was deleted
        const deletedCategories = await db.select()
            .from(categoriesTable)
            .where(eq(categoriesTable.id, categoryId))
            .execute();

        expect(deletedCategories).toHaveLength(0);

        // Verify task still exists but with no category
        const existingTasks = await db.select()
            .from(tasksTable)
            .where(eq(tasksTable.id, taskResult[0].id))
            .execute();

        expect(existingTasks).toHaveLength(1);
        expect(existingTasks[0].category_id).toBe(null);
    });
});
