import type { FieldMetadata } from "@conform-to/react";
import { getFormProps, getInputProps } from "@conform-to/react";
import { Copy, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher, useNavigate } from "react-router";

import { SubmitActions } from "~/components/form/submitActions";
import { PageTitle } from "~/components/ui/admin/pageTitle";
import { Button } from "~/components/ui/button";
import { ConformSwitch } from "~/components/ui/conform/conformSwitch";
import { Container } from "~/components/ui/container";
import { FieldGroup, FieldSeparator, FieldSet } from "~/components/ui/field";
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
import { Textarea } from "~/components/ui/textarea";
import { FIELD_TYPE, type FieldDraft } from "~/models/formFields";
import { FORM_STATUS, type FormStatus } from "~/models/forms";
import type { RouteHandle } from "~/route-handle";
import { FieldOptionsEditor } from "~/routes/admin/forms/new/features/fieldOptionsEditor";
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

  useEffect(() => {
    console.log(fields.fields.value);
  }, [fields.fields]);

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
    <div className="flex flex-col">
      <Container>
        <PageTitle title="新規フォーム作成" />
      </Container>
      <Container>
        <fetcher.Form
          className="max-w-2xl space-y-6"
          method="post"
          {...getFormProps(form)}
          action="/api/forms/create"
        >
          <FieldSet>
            <FieldGroup>
              <FieldControl
                label="フォームタイトル"
                htmlFor="title"
                required
                errors={fields.title.errors}
              >
                <Input {...getInputProps(fields.title, { type: "text" })} />
              </FieldControl>
              <FieldControl
                label="概要"
                htmlFor="description"
                errors={fields.description.errors}
              >
                <Textarea id="description" name="description" />
              </FieldControl>
            </FieldGroup>
          </FieldSet>
          <FieldSeparator className="mb-6">フォーム項目</FieldSeparator>
          <FieldSet>
            {formFieldsList.map((fieldMeta, index) => {
              const fieldset = fieldMeta.getFieldset();
              return (
                <FieldCard key={fieldMeta.key}>
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
                            ref={(el) => {
                              if (el && index === lastFocusedFieldIndex) {
                                el.focus();
                                setLastFocusedFieldIndex(null);
                              }
                            }}
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
                            onValueChange={(value) => {
                              handleChangeFieldType(fieldMeta, value);
                            }}
                            defaultValue={FIELD_TYPE.RADIO}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="フィールドタイプ" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={FIELD_TYPE.TEXT}>
                                テキスト
                              </SelectItem>
                              <SelectItem value={FIELD_TYPE.TEXTAREA}>
                                テキストエリア
                              </SelectItem>
                              <SelectItem value={FIELD_TYPE.CHECKBOX}>
                                チェックボックス
                              </SelectItem>
                              <SelectItem value={FIELD_TYPE.RADIO}>
                                ラジオボタン
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FieldControl>
                      </div>
                      <div>
                        <FieldControl
                          label=""
                          htmlFor={`fields.${index}.fieldOptions`}
                          errors={fields.fields.errors}
                          noRequiredLabel={true}
                        >
                          <FieldOptionsEditor
                            form={form}
                            fieldMetadata={fieldMeta}
                          />
                        </FieldControl>
                      </div>
                    </FieldGroup>
                  </FieldCardContent>
                  <FieldCardFooter>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveField(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyField(index)}
                    >
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
            })}
          </FieldSet>
          <div>
            <Button type="button" variant="outline" onClick={handleAddField}>
              フォーム項目を追加
            </Button>
          </div>
          {fetcher.data && !fetcher.data.success && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {fetcher.data.error.message}
            </div>
          )}

          <input type="hidden" name="status" value={status} />
          <SubmitActions
            isSubmitting={fetcher.state === "submitting"}
            onDraftSave={() => setStatus(FORM_STATUS.DRAFT)}
            onPublish={() => setStatus(FORM_STATUS.PUBLISHED)}
            cancelTo="/admin/forms"
          />
        </fetcher.Form>
      </Container>
    </div>
  );
}
