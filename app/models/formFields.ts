import { z } from "zod";

import { JsonSchema } from "~/models/json";

export const FIELD_TYPE = {
  TEXT: "text",
  EMAIL: "email",
  TEL: "tel",
  SELECT: "select",
  CHECKBOX: "checkbox",
  RADIO: "radio",
  TEXTAREA: "textarea",
} as const;

export type FieldType = (typeof FIELD_TYPE)[keyof typeof FIELD_TYPE];

export const FieldOptionsSchema = z.object({
  options: z.array(z.string()),
});
export type FieldOptions = z.infer<typeof FieldOptionsSchema>;

const FieldBaseSchema = z.object({
  fieldType: z.enum([
    FIELD_TYPE.TEXT,
    FIELD_TYPE.EMAIL,
    FIELD_TYPE.TEL,
    FIELD_TYPE.SELECT,
    FIELD_TYPE.CHECKBOX,
    FIELD_TYPE.RADIO,
    FIELD_TYPE.TEXTAREA,
  ]),
  label: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  isRequired: z.boolean().default(false),
  displayOrder: z.number().default(0),
  validationRules: JsonSchema.optional(),
  fieldOptions: FieldOptionsSchema.optional(),
});

export const FieldDraftSchema = FieldBaseSchema;
export type FieldDraft = z.infer<typeof FieldDraftSchema>;

export const FieldInputSchema = FieldBaseSchema.extend({
  formId: z.string().uuid(),
});
export type FieldInput = z.infer<typeof FieldInputSchema>;
