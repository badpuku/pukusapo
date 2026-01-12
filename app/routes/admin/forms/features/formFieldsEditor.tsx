import type { FieldMetadata, FormMetadata } from "@conform-to/react";

import { Button } from "~/components/ui/button";
import { FieldSet } from "~/components/ui/field";
import type { FieldDraft } from "~/models/formFields";
import type { FormWithFieldsInput } from "~/models/forms";
import { FormFieldCard } from "~/routes/admin/forms/features/formFieldCard";

interface FormFieldsEditorProps {
  form: FormMetadata<FormWithFieldsInput>;
  fields: FieldMetadata<FieldDraft[]>;
  onAddField: () => void;
  onRemoveField: (index: number) => void;
  onCopyField: (index: number) => void;
  onChangeFieldType: (
    fieldMeta: FieldMetadata<FieldDraft>,
    value: string,
  ) => void;
  lastFocusedFieldIndex: number | null;
}

export const FormFieldsEditor = ({
  form,
  fields,
  onAddField,
  onRemoveField,
  onCopyField,
  onChangeFieldType,
  lastFocusedFieldIndex,
}: FormFieldsEditorProps) => {
  const formFieldsList = fields.getFieldList();

  return (
    <>
      <FieldSet>
        {formFieldsList.map((fieldMeta, index) => (
          <FormFieldCard
            key={fieldMeta.key}
            fieldMetadata={fieldMeta}
            form={form}
            onRemove={() => onRemoveField(index)}
            onCopy={() => onCopyField(index)}
            onChangeFieldType={(value) => onChangeFieldType(fieldMeta, value)}
            initialFocus={index === lastFocusedFieldIndex}
          />
        ))}
      </FieldSet>

      <div>
        <Button type="button" variant="outline" onClick={onAddField}>
          フォーム項目を追加
        </Button>
      </div>
    </>
  );
};
