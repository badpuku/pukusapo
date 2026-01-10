import { z } from "zod";

import { FIELD_TYPE } from "~/models/formFields";
import { JsonSchema } from "~/models/json";

export const FormFieldsResponseSchema = z.object({
  id: z.string(),
  formId: z.string(),
  fieldType: z.enum([
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
  isRequired: z.boolean(),
  displayOrder: z.number(),
  validationRules: JsonSchema.nullable(),
  fieldOptions: JsonSchema.nullable(),
});

export type FormFieldsResponse = z.infer<typeof FormFieldsResponseSchema>;
