import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";

import { type FormInput, FormInputSchema } from "~/models/forms";

export const useFormsForm = (options?: {
  defaultValue?: Partial<FormInput>;
}) => {
  return useForm({
    defaultValue: options?.defaultValue,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: FormInputSchema });
    },
  });
};
