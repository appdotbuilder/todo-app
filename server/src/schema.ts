
import { z } from 'zod';

// Priority enum
export const priorityEnum = z.enum(['low', 'medium', 'high']);
export type Priority = z.infer<typeof priorityEnum>;

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

// Task schema
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  due_date: z.coerce.date().nullable(),
  completed: z.boolean(),
  priority: priorityEnum,
  category_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Input schema for creating categories
export const createCategoryInputSchema = z.object({
  name: z.string().min(1),
  color: z.string().nullable().optional()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

// Input schema for updating categories
export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  color: z.string().nullable().optional()
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

// Input schema for creating tasks
export const createTaskInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  due_date: z.coerce.date().nullable().optional(),
  priority: priorityEnum.default('medium'),
  category_id: z.number().nullable().optional()
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating tasks
export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  due_date: z.coerce.date().nullable().optional(),
  completed: z.boolean().optional(),
  priority: priorityEnum.optional(),
  category_id: z.number().nullable().optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Filter schema for getting tasks
export const getTasksFilterSchema = z.object({
  completed: z.boolean().optional(),
  category_id: z.number().optional(),
  priority: priorityEnum.optional()
});

export type GetTasksFilter = z.infer<typeof getTasksFilterSchema>;
