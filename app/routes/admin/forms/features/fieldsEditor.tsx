import type { FieldMetadata, FormMetadata } from "@conform-to/react";

import { Button } from "~/components/ui/button";
import { FieldSet } from "~/components/ui/field";
import type { FieldDraft } from "~/models/formFields";
import type { FormWithFieldsInput } from "~/models/forms";
import { FieldItem } from "~/routes/admin/forms/features/fieldItem";

interface FieldsEditorProps {
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

export const FieldsEditor = ({
  form,
  fields,
  onAddField,
  onRemoveField,
  onCopyField,
  onChangeFieldType,
  lastFocusedFieldIndex,
}: FieldsEditorProps) => {
  const formFieldsList = fields.getFieldList();

  return (
    <>
      <FieldSet>
        {formFieldsList.map((fieldMeta, index) => (
          <FieldItem
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
        <Button type="button" variant="outline" onClick={onAddField} className="w-full shadow-none border-dotted">
          フォーム項目を追加
        </Button>
      </div>
    </>
  );
};
