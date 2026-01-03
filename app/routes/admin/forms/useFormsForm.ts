import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";

import { FormSchema } from "~/models/forms";

export const useFormsForm = () => {
  return useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: FormSchema });
    },
  });
};
