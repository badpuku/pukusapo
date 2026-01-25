import { z } from "zod";

import { FIELD_TYPE, FieldOptionsSchema } from "~/models/formFields";
import { JsonSchema } from "~/models/json";

export const FormFieldsResponseSchema = z.object({
  id: z.string(),
  form_id: z.string(),
  field_type: z.enum([
    FIELD_TYPE.TEXT,
    FIELD_TYPE.EMAIL,
    FIELD_TYPE.TEL,
    FIELD_TYPE.SELECT,
    FIELD_TYPE.CHECKBOX,
    FIELD_TYPE.RADIO,
    FIELD_TYPE.TEXTAREA,
  ] as const),
  label: z.string(),
  description: z.string().nullable(),
  is_required: z.boolean(),
  display_order: z.number(),
  validation_rules: JsonSchema.nullable(),
  field_options: FieldOptionsSchema.nullable(),
});

export type FormFieldsResponse = z.infer<typeof FormFieldsResponseSchema>;
