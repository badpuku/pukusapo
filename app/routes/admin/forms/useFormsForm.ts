import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";

import {
  type FormWithFieldsInput,
  FormWithFieldsInputSchema,
} from "~/models/forms";

export const useFormsForm = (options?: {
  defaultValue?: Partial<FormWithFieldsInput>;
}) => {
  return useForm<FormWithFieldsInput>({
    defaultValue: options?.defaultValue,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: FormWithFieldsInputSchema });
    },
  });
};
