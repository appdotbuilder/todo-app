
import { db } from '../db';
import { categoriesTable, tasksTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const deleteCategoryInputSchema = z.object({
    id: z.number()
});

export type DeleteCategoryInput = z.infer<typeof deleteCategoryInputSchema>;

export async function deleteCategory(input: DeleteCategoryInput): Promise<{ success: boolean }> {
    try {
        // Check if category exists
        const existingCategory = await db.select()
            .from(categoriesTable)
            .where(eq(categoriesTable.id, input.id))
            .execute();

        if (existingCategory.length === 0) {
            throw new Error('Category not found');
        }

        // Check if there are tasks assigned to this category
        const tasksWithCategory = await db.select()
            .from(tasksTable)
            .where(eq(tasksTable.category_id, input.id))
            .execute();

        if (tasksWithCategory.length > 0) {
            throw new Error('Cannot delete category with assigned tasks');
        }

        // Delete the category
        await db.delete(categoriesTable)
            .where(eq(categoriesTable.id, input.id))
            .execute();

        return { success: true };
    } catch (error) {
        console.error('Category deletion failed:', error);
        throw error;
    }
}
