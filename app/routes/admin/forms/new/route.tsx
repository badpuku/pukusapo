import type { FieldMetadata } from "@conform-to/react";
import { getFormProps } from "@conform-to/react";
import { useEffect, useState } from "react";
import { useFetcher, useNavigate } from "react-router";

import { SubmitActions } from "~/components/form/submitActions";
import { Container } from "~/components/ui/container";
import { FieldSet } from "~/components/ui/field";
import { FieldCard, FieldCardContent } from "~/components/ui/fieldCard";
import { Title } from "~/components/ui/title";
import { FIELD_TYPE, type FieldDraft } from "~/models/formFields";
import { FORM_STATUS, type FormStatus } from "~/models/forms";
import type { RouteHandle } from "~/route-handle";
import { BasicInfoFields } from "~/routes/admin/forms/features/basicInfoFields";
import { FormFieldsEditor } from "~/routes/admin/forms/features/formFieldsEditor";
import { useFormsForm } from "~/routes/admin/forms/useFormsForm";

export const handle: RouteHandle = {
  breadcrumb: (match) => ({
    to: match.pathname,
    title: "フォーム新規作成",
  }),
};

export default function AdminFormsNewRoute() {
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const [form, fields] = useFormsForm({
    defaultValue: {
      fields: [
        {
          fieldType: FIELD_TYPE.RADIO,
          label: "",
          isRequired: false,
          displayOrder: 0,
          description: "",
          validationRules: {},
          fieldOptions: { options: [] },
        },
      ],
    },
  });
  const [status, setStatus] = useState<FormStatus>(FORM_STATUS.DRAFT);
  const [lastFocusedFieldIndex, setLastFocusedFieldIndex] = useState<
    number | null
  >(null);
  const formFieldsList = fields.fields.getFieldList();

  // API呼び出し成功時にリダイレクト
  useEffect(() => {
    if (fetcher.data?.success) {
      navigate("/admin/forms");
    }
  }, [fetcher.data?.success, navigate]);

  const handleAddField = () => {
    const index = formFieldsList.length;
    form.insert({
      name: fields.fields.name,
    });
    setLastFocusedFieldIndex(index);
  };

  const handleRemoveField = (index: number) => {
    form.remove({
      name: fields.fields.name,
      index,
    });
  };

  const handleCopyField = (index: number) => {
    form.insert({
      name: fields.fields.name,
      defaultValue: {
        fieldType: formFieldsList[index].getFieldset().fieldType.value,
        label: formFieldsList[index].getFieldset().label.value,
        isRequired: formFieldsList[index].getFieldset().isRequired.value,
        displayOrder: formFieldsList[index].getFieldset().displayOrder.value,
        validationRules:
          formFieldsList[index].getFieldset().validationRules.value,
        fieldOptions: {
          options: [
            ...(formFieldsList[index].getFieldset().fieldOptions.getFieldset()
              .options.value ?? []),
          ],
        },
      },
    });
  };

  const handleChangeFieldType = (
    fieldMeta: FieldMetadata<FieldDraft>,
    value: string,
  ) => {
    if (value === fieldMeta.getFieldset().fieldType.value) return;

    form.update({
      name: fieldMeta.getFieldset().fieldType.name,
      value,
    });

    if (value === FIELD_TYPE.RADIO || value === FIELD_TYPE.CHECKBOX) {
      form.update({
        name: fieldMeta.getFieldset().fieldOptions.getFieldset().options.name,
        value: [""],
      });
    }
  };

  return (
    <div className="flex flex-col grow">
      <div className="flex grow">
        <Container className="grow border-r border-zinc-200 bg-transparent">
          <fetcher.Form
            className="max-w-2xl space-y-6"
            method="post"
            {...getFormProps(form)}
            action="/api/forms/create"
          >
            <Title as="h3" className="mb-2">
              基本情報
            </Title>
            <FieldCard>
              <FieldCardContent>
                <FieldSet>
                  <BasicInfoFields
                    titleField={fields.title}
                    descriptionField={fields.description}
                  />
                </FieldSet>
              </FieldCardContent>
            </FieldCard>
            <Title as="h3" className="mb-2">
              フォーム項目
            </Title>
            <FormFieldsEditor
              form={form}
              fields={fields.fields}
              onAddField={handleAddField}
              onRemoveField={handleRemoveField}
              onCopyField={handleCopyField}
              onChangeFieldType={handleChangeFieldType}
              lastFocusedFieldIndex={lastFocusedFieldIndex}
            />
            {fetcher.data && !fetcher.data.success && (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {fetcher.data.error.message}
              </div>
            )}

            <input type="hidden" name="status" value={status} />
          </fetcher.Form>
        </Container>
        <div className="w-[375px] bg-white">プレビュー</div>
      </div>
      <div className="sticky bottom-0 bg-white border-t border-zinc-200">
        <SubmitActions
          isSubmitting={fetcher.state === "submitting"}
          formId={form.id}
          handleDraftSubmit={() => setStatus(FORM_STATUS.DRAFT)}
          handlePublishSubmit={() => setStatus(FORM_STATUS.PUBLISHED)}
          cancelTo="/admin/forms"
        />
      </div>
    </div>
  );
}
