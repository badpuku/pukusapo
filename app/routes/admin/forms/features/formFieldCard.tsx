import type { FieldMetadata, FormMetadata } from "@conform-to/react";
import { getInputProps } from "@conform-to/react";
import { Copy, Trash2 } from "lucide-react";

import { Button } from "~/components/ui/button";
import { ConformSwitch } from "~/components/ui/conform/conformSwitch";
import { FieldGroup } from "~/components/ui/field";
import {
  FieldCard,
  FieldCardContent,
  FieldCardFooter,
} from "~/components/ui/fieldCard";
import { FieldControl } from "~/components/ui/fieldControl";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { FIELD_TYPE, type FieldDraft } from "~/models/formFields";
import type { FormWithFieldsInput } from "~/models/forms";
import { FieldOptionsEditor } from "~/routes/admin/forms/features/fieldOptionsEditor";

/**
 * FormFieldCard Props
 * 個別フォーム項目のカードコンポーネントのProps
 */
interface FormFieldCardProps {
  fieldMetadata: FieldMetadata<FieldDraft>;
  form: FormMetadata<FormWithFieldsInput>;
  onRemove: () => void;
  onCopy: () => void;
  onChangeFieldType: (value: string) => void;
  /** 自動フォーカス */
  autoFocus?: boolean;
}
export const FormFieldCard = ({
  fieldMetadata,
  form,
  onRemove,
  onCopy,
  onChangeFieldType,
  autoFocus = false,
}: FormFieldCardProps) => {
  const fieldset = fieldMetadata.getFieldset();

  return (
    <FieldCard>
      <FieldCardContent>
        <FieldGroup>
          <div>
            <FieldControl
              label=""
              htmlFor={fieldset.label.id}
              errors={fieldset.label.errors}
              noRequiredLabel={true}
            >
              <Input
                {...getInputProps(fieldset.label, {
                  type: "text",
                })}
                placeholder="項目名"
                // eslint-disable-next-line jsx-a11y/no-autofocus -- フィールド追加時のUX向上のため必要
                autoFocus={autoFocus}
              />
            </FieldControl>
          </div>
          <div className="flex items-center gap-2">
            <FieldControl
              label=""
              htmlFor={fieldset.fieldType.id}
              errors={fieldset.fieldType.errors}
              noRequiredLabel={true}
              className="grow"
            >
              <Select
                key={fieldset.fieldType.key}
                name={fieldset.fieldType.name}
                value={fieldset.fieldType.initialValue}
                onValueChange={onChangeFieldType}
                defaultValue={FIELD_TYPE.RADIO}
              >
                <SelectTrigger>
                  <SelectValue placeholder="フィールドタイプ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FIELD_TYPE.TEXT}>テキスト</SelectItem>
                  <SelectItem value={FIELD_TYPE.TEXTAREA}>
                    テキストエリア
                  </SelectItem>
                  <SelectItem value={FIELD_TYPE.CHECKBOX}>
                    チェックボックス
                  </SelectItem>
                  <SelectItem value={FIELD_TYPE.RADIO}>ラジオボタン</SelectItem>
                </SelectContent>
              </Select>
            </FieldControl>
          </div>
          <div>
            <FieldControl
              label=""
              htmlFor={`${fieldset.fieldType.name}.fieldOptions`}
              errors={fieldMetadata.errors}
              noRequiredLabel={true}
            >
              <FieldOptionsEditor form={form} fieldMetadata={fieldMetadata} />
            </FieldControl>
          </div>
        </FieldGroup>
      </FieldCardContent>

      <FieldCardFooter>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={onCopy}>
          <Copy className="h-4 w-4" />
        </Button>
        <FieldControl
          label=""
          htmlFor={fieldset.isRequired.id}
          errors={fieldset.isRequired.errors}
          noRequiredLabel={true}
          className="flex-row items-center gap-2"
        >
          <Label htmlFor={fieldset.isRequired.id}>必須</Label>
          <ConformSwitch
            id={fieldset.isRequired.id}
            name={fieldset.isRequired.name}
            defaultChecked={fieldset.isRequired.defaultChecked}
          />
        </FieldControl>
      </FieldCardFooter>
    </FieldCard>
  );
};
