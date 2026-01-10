import { z } from "zod";

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
  type: z.enum([FIELD_TYPE.SELECT, FIELD_TYPE.CHECKBOX, FIELD_TYPE.RADIO] as const),
  options: z.array(z.string()),
});

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];
const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]),
);

export const FieldInputSchema = z.object({
  formId: z.string().uuid(),
  fieldType: z.enum([FIELD_TYPE.TEXT, FIELD_TYPE.EMAIL, FIELD_TYPE.TEL, FIELD_TYPE.SELECT, FIELD_TYPE.CHECKBOX, FIELD_TYPE.RADIO, FIELD_TYPE.TEXTAREA] as const),
  label: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  isRequired: z.boolean().default(false),
  displayOrder: z.number().default(0),
  validationRules: jsonSchema.optional(),
  fieldOptions: jsonSchema.optional(),
});

export type FieldInput = z.infer<typeof FieldInputSchema>;