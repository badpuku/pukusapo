import {
  type FieldMetadata,
  type FormMetadata,
  getInputProps,
} from "@conform-to/react";
import { Circle, X } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { FieldDraft } from "~/models/formFields";
import type { FormWithFieldsInput } from "~/models/forms";

interface OptionsListEditorProps {
  form: FormMetadata<FormWithFieldsInput>;
  fieldMetadata: FieldMetadata<FieldDraft>;
}

export const OptionsListEditor = ({
  form,
  fieldMetadata,
}: OptionsListEditorProps) => {
  const fieldOptionsList = fieldMetadata
    .getFieldset()
    .fieldOptions.getFieldset().options;
  const [lastFocusedOptionIndex, setLastFocusedOptionIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {fieldOptionsList.getFieldList().map((optionMeta, index) => (
        <div key={optionMeta.key} className="flex items-center gap-3">
          <div className="aspect-square h-2 w-2 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
            <Circle className="h-1.5 w-1.5 fill-primary" />
          </div>
          <Input
            {...getInputProps(optionMeta, { type: "text" })}
            placeholder="選択肢"
            ref={(el) => {
              if (el && index === lastFocusedOptionIndex) {
                el.focus();
                setLastFocusedOptionIndex(null);
              }
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              form.remove({
                name: fieldOptionsList.name,
                index,
              });
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <div className="pl-5">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const index = fieldOptionsList.getFieldList().length;
            form.insert({
              name: fieldOptionsList.name,
              defaultValue: "",
            });
            setLastFocusedOptionIndex(index);
          }}
        >
          選択肢を追加
        </Button>
      </div>
    </div>
  );
};
