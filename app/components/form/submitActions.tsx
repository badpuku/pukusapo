import { Save, Trash2 } from "lucide-react";
import { Link } from "react-router";

import { Button } from "~/components/ui/button";

interface SubmitActionsProps {
  isSubmitting: boolean;
  formId: string;
  onDraftSubmit: () => void;
  onPublishSubmit: () => void;
  onDelete?: () => void;
  cancelTo: string;
}

export function SubmitActions({
  isSubmitting,
  formId,
  onDraftSubmit,
  onPublishSubmit,
  onDelete,
  cancelTo,
}: SubmitActionsProps) {
  return (
    <div className="flex gap-2 items-center px-6 py-4">
      <Button type="button" variant="ghost" size="sm" asChild>
        <Link to={cancelTo}>キャンセル</Link>
      </Button>
      {onDelete && (
        <Button
          form={formId}
          type="button"
          variant="outline"
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
          削除
        </Button>
      )}
      <Button
        form={formId}
        type="submit"
        variant="secondary"
        disabled={isSubmitting}
        onClick={onDraftSubmit}
      >
        <Save className="size-4" />
        下書き保存
      </Button>
      <Button
        form={formId}
        type="submit"
        disabled={isSubmitting}
        onClick={onPublishSubmit}
      >
        <Save className="size-4" />
        公開
      </Button>
    </div>
  );
}
