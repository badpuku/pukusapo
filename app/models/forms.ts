import { z } from "zod";

export const CreateFormSchema = z.object({
  title: z
    .string()
    .min(1, { message: "タイトルを入力してください" })
    .max(200, { message: "タイトルは200文字以内で入力してください" }),
  description: z
    .string()
    .max(1000, { message: "概要は1000文字以内で入力してください" })
    .optional()
    .or(z.literal("")),
  status: z.enum(["draft", "published"]),
});

export type CreateFormInput = z.infer<typeof CreateFormSchema>;
