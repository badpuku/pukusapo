import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";

import {
  type FacilityAccountInput,
  FacilityAccountInputSchema,
  type FacilityAccountUpdateInput,
  FacilityAccountUpdateInputSchema,
} from "~/models/facilityAccounts";

export const useFacilityAccountForm = (options?: {
  defaultValue?: Partial<FacilityAccountInput>;
}) => {
  return useForm<FacilityAccountInput>({
    defaultValue: options?.defaultValue,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: FacilityAccountInputSchema });
    },
  });
};

export const useFacilityAccountUpdateForm = (options?: {
  defaultValue?: Partial<FacilityAccountUpdateInput>;
}) => {
  return useForm<FacilityAccountUpdateInput>({
    defaultValue: options?.defaultValue,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: FacilityAccountUpdateInputSchema });
    },
  });
};
