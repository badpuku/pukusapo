import type { FormMetadata } from "@conform-to/react";

import { FieldControl } from "~/components/ui/fieldControl";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { Title } from "~/components/ui/title";
import type { FormWithFieldsInput } from "~/models/forms";

interface PreviewProps {
  form: FormMetadata<FormWithFieldsInput>;
}

export const Preview = ({ form }: PreviewProps) => {
  const fieldset = form.getFieldset();

  const title = fieldset.title.value ?? "タイトル";
  const description = fieldset.description.value;
  const fields = fieldset.fields.getFieldList();

  return (
    <div className="w-[375px] bg-white p-4">
      <Title as="h1">{title}</Title>
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      <Separator className="my-4" />
      <div className="flex flex-col gap-4">
        {fields.map((field) => (
          <FieldControl
            key={field.key}
            label={field.getFieldset().label.value ?? ""}
            htmlFor={field.getFieldset().label.id}
            required={field.getFieldset().isRequired.value ? true : false}
            errors={field.getFieldset().label.errors}
          >
            <Input type="text" />
          </FieldControl>
        ))}
      </div>
    </div>
  );
};
