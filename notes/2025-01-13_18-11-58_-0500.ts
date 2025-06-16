// Mutators
import { z } from "zod";

const todoSchema = z.object({
  id: z.string(),
  content: z.string(),
  dueDate: z.string().optional(),
});

type Todo = z.infer<typeof todoSchema>;

const createTodoMutationSchema = z.object({
  name: z.literal("createTodo"),
  args: todoSchema,
});

const updateTodoMutationSchema = z.object({
  name: z.literal("updateTodo"),
  args: todoSchema.partial().extend({
    id: z.string(),
  }),
});

const deleteTodoMutationSchema = z.object({
  name: z.literal("deleteTodo"),
  args: z.object({
    id: z.string(),
  }),
});

const deleteTodoMutationSchema = z.object({
  name: z.literal("deleteTodo"),
  args: z.object({
    id: z.string(),
  }),
});

const MutationSchema = z.union([
  createTodoMutationSchema,
  updateTodoMutationSchema,
  deleteTodoMutationSchema,
]);

type Mutation = z.infer<typeof MutationSchema>;
