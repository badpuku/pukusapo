import type { FieldMetadata } from "@conform-to/react";
import { getFormProps } from "@conform-to/react";
import { useEffect, useState } from "react";
import {
  data,
  useFetcher,
  useLoaderData,
  useNavigate,
} from "react-router";

import { SubmitActions } from "~/components/form/submitActions";
import { Container } from "~/components/ui/container";
import { FieldSet } from "~/components/ui/field";
import { FieldCard, FieldCardContent } from "~/components/ui/fieldCard";
import { Title } from "~/components/ui/title";
import { ERROR_CODES, ERROR_STATUS_MAP } from "~/constants/errors";
import { FIELD_TYPE, type FieldDraft } from "~/models/formFields";
import { FORM_STATUS, type FormStatus } from "~/models/forms";
import type { RouteHandle } from "~/route-handle";
import { BasicInfoFields } from "~/routes/admin/forms/features/basicInfoFields";
import { FieldsEditor } from "~/routes/admin/forms/features/fieldsEditor";
import { useFormsForm } from "~/routes/admin/forms/useFormsForm";
import { getFormByIdWithFields } from "~/services/forms/get.server";

import type { Route } from "./+types/route";

export const handle: RouteHandle = {
  breadcrumb: (match) => {
    return {
      to: match.pathname,
      title: "フォーム詳細",
    };
  },
};

export const loader = async (args: Route.LoaderArgs) => {
  const { params } = args;
  const formId = params.id;

  const response = await getFormByIdWithFields(args, formId);

  if (!response.success) {
    throw data(response.error.message, { status: response.status });
  }

  if (!response.data) {
    throw data("フォームが見つかりません。", {
      status: ERROR_STATUS_MAP[ERROR_CODES.RESOURCE_NOT_FOUND],
    });
  }

  return data(
    { success: true, data: response.data, error: null },
    { status: response.status },
  );
};

export default function AdminFormsIdRoute() {
  const { data: formData } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const [status, setStatus] = useState<FormStatus>(formData.status);
  const [lastFocusedFieldIndex, setLastFocusedFieldIndex] = useState<
    number | null
  >(null);

  const [form, fields] = useFormsForm({
    defaultValue: {
      title: formData.title,
      description: formData.description || "",
      status: formData.status,
      fields: (formData.fields || []).map((field) => ({
        id: field.id,
        fieldType: field.field_type,
        label: field.label,
        description: field.description || "",
        isRequired: field.is_required,
        displayOrder: field.display_order,
        validationRules: field.validation_rules || {},
        fieldOptions: field.field_options || { options: [] },
      })),
    },
  });

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
            action={`/api/forms/${formData.id}/update`}
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
            <FieldsEditor
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
