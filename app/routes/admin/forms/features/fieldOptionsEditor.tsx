import type { FieldMetadata, FormMetadata } from "@conform-to/react";

import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import type { FieldDraft } from "~/models/formFields";
import { FIELD_TYPE } from "~/models/formFields";
import type { FormWithFieldsInput } from "~/models/forms";
import { OptionsEditor } from "~/routes/admin/forms/features/optionsEditor";

interface FieldOptionsEditorProps {
  form: FormMetadata<FormWithFieldsInput>;
  fieldMetadata: FieldMetadata<FieldDraft>;
}

export const FieldOptionsEditor = ({
  form,
  fieldMetadata,
}: FieldOptionsEditorProps) => {
  const fieldType = fieldMetadata.getFieldset().fieldType.value;

  switch (fieldType) {
    case FIELD_TYPE.RADIO:
      return <OptionsEditor form={form} fieldMetadata={fieldMetadata} />;
    case FIELD_TYPE.CHECKBOX:
      return <OptionsEditor form={form} fieldMetadata={fieldMetadata} />;
    case FIELD_TYPE.TEXT:
      return <Input type="text" placeholder="短文の入力フィールドを表示" readOnly disabled />;
    case FIELD_TYPE.TEXTAREA:
      return <Textarea rows={1} placeholder="長文の入力フィールドを表示" readOnly disabled />;
    default:
      return null;
  }
};
