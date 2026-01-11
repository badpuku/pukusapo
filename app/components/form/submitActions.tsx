import { Save, Trash2 } from "lucide-react";
import { Link } from "react-router";

import { Button } from "~/components/ui/button";

interface SubmitActionsProps {
  isSubmitting: boolean;
  onDraftSave: () => void;
  onPublish: () => void;
  onDelete?: () => void;
  cancelTo: string;
}

export function SubmitActions({
  isSubmitting,
  onDraftSave,
  onPublish,
  onDelete,
  cancelTo,
}: SubmitActionsProps) {
  return (
    <div className="flex gap-2">
      {onDelete && (
        <Button type="button" variant="outline" onClick={onDelete}>
          <Trash2 className="size-4" />
          削除
        </Button>
      )}
      <Button type="submit" disabled={isSubmitting} onClick={onDraftSave}>
        <Save className="size-4" />
        下書き保存
      </Button>
      <Button type="submit" disabled={isSubmitting} onClick={onPublish}>
        <Save className="size-4" />
        公開
      </Button>
      <Button type="button" variant="outline" asChild>
        <Link to={cancelTo}>キャンセル</Link>
      </Button>
    </div>
  );
}
