import type { FieldMetadata } from "@conform-to/react";
import { getInputProps } from "@conform-to/react";

import { FieldGroup } from "~/components/ui/field";
import { FieldControl } from "~/components/ui/fieldControl";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

interface BasicInfoFieldsProps {
  titleField: FieldMetadata<string>;
  descriptionField: FieldMetadata<string>;
} 

export const BasicInfoFields = ({ titleField, descriptionField }: BasicInfoFieldsProps) => {
  return (
    <FieldGroup>
      <FieldControl
        label="フォームタイトル"
        htmlFor="title"
        required
        errors={titleField.errors}
      >
        <Input {...getInputProps(titleField, { type: "text" })} />
      </FieldControl>
      <FieldControl
        label="概要"
        htmlFor="description"
        errors={descriptionField.errors}
      >
        <Textarea {...getInputProps(descriptionField, { type: "text" })} />
      </FieldControl>
    </FieldGroup>
  );
};
