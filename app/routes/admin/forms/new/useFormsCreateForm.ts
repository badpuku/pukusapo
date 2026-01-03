import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";

import { CreateFormSchema } from "~/models/forms";

export const useFormsCreateForm = () => {
  const form = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: CreateFormSchema });
    },
  });

  return form;
};
