import { type EmailOtpType } from "@supabase/supabase-js";
import { z } from "zod";

export const EmailOtpTypeSchema = z.enum(["signup", "invite", "magiclink", "recovery", "email_change", "email"])satisfies z.ZodType<EmailOtpType>;

export const PathSchema = z.string().regex(/^\/[a-zA-Z0-9-_/]*$/);

export const SingUpConfirmQueryParamsSchema = z.object({
  token_hash: z.string(),
  type: EmailOtpTypeSchema,
  next: z.union([PathSchema, z.null()]),
})
