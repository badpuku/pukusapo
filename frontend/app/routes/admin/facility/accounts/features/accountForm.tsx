import type { FieldMetadata } from "@conform-to/react";
import { getInputProps } from "@conform-to/react";

import { FieldGroup } from "~/components/ui/field";
import { FieldControl } from "~/components/ui/fieldControl";
import { Input } from "~/components/ui/input";

interface AccountFormFieldsProps {
  userIdField: FieldMetadata<string>;
  passwordField: FieldMetadata<string>;
  circleNameField: FieldMetadata<string | undefined>;
  representativeNameField: FieldMetadata<string | undefined>;
  isEdit?: boolean;
}

export const AccountFormFields = ({
  userIdField,
  passwordField,
  circleNameField,
  representativeNameField,
  isEdit = false,
}: AccountFormFieldsProps) => {
  return (
    <FieldGroup>
      <FieldControl
        label="ユーザーID"
        htmlFor="userId"
        required
        errors={userIdField.errors}
      >
        <Input
          {...getInputProps(userIdField, { type: "text" })}
          placeholder="12345678"
          maxLength={8}
        />
      </FieldControl>
      <FieldControl
        label="パスワード"
        htmlFor="password"
        required={!isEdit}
        errors={passwordField.errors}
      >
        <Input
          {...getInputProps(passwordField, { type: "password" })}
          placeholder={isEdit ? "変更する場合のみ入力" : ""}
        />
      </FieldControl>
      <FieldControl
        label="サークル名"
        htmlFor="circleName"
        errors={circleNameField.errors}
      >
        <Input {...getInputProps(circleNameField, { type: "text" })} />
      </FieldControl>
      <FieldControl
        label="代表者名"
        htmlFor="representativeName"
        errors={representativeNameField.errors}
      >
        <Input {...getInputProps(representativeNameField, { type: "text" })} />
      </FieldControl>
    </FieldGroup>
  );
};
