import { ArrowLeft, Save } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { RouteHandle } from "~/route-handle";

export const handle: RouteHandle = {
  breadcrumb: (match) => ({
    to: match.pathname,
    title: "新規作成",
  }),
};

export default function AdminFormsNewRoute() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: フォーム作成のAPIコール実装
    console.log("フォームデータ:", formData);
    // 成功後、フォーム一覧画面へ遷移
    navigate("/admin/forms");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">新規フォーム作成</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            フォームタイトル <span className="text-red-500">*</span>
          </label>
          <Input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            placeholder="例: お問い合わせフォーム"
            required
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            説明
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="このフォームの説明を入力してください"
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <div className="flex items-center gap-4">
          <Button type="submit">
            <Save className="mr-2 h-4 w-4" />
            フォームを作成
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/admin/forms">キャンセル</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}