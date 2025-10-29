import { describe, expect, it } from "vitest";

import { createFormSchema } from "~/routes/api/forms/create/validation";

describe("createFormSchema", () => {
  describe("title validation", () => {
    it("有効なtitleを受け入れる", () => {
      const result = createFormSchema.safeParse({
        title: "有効なフォームタイトル",
        status: "draft",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("有効なフォームタイトル");
      }
    });

    it("titleが空文字列の場合エラー", () => {
      const result = createFormSchema.safeParse({
        title: "",
        status: "draft",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("タイトルは必須です");
      }
    });

    it("titleが空白のみの場合エラー", () => {
      const result = createFormSchema.safeParse({
        title: "   ",
        status: "draft",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("タイトルは空白のみにできません");
      }
    });

    it("titleが201文字の場合エラー", () => {
      const longTitle = "あ".repeat(201);
      const result = createFormSchema.safeParse({
        title: longTitle,
        status: "draft",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("タイトルは200文字以内で入力してください");
      }
    });

    it("titleが200文字の場合は受け入れる", () => {
      const maxTitle = "あ".repeat(200);
      const result = createFormSchema.safeParse({
        title: maxTitle,
        status: "draft",
      });

      expect(result.success).toBe(true);
    });

    it("titleの前後の空白をトリムする", () => {
      const result = createFormSchema.safeParse({
        title: "  タイトル  ",
        status: "draft",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("タイトル");
      }
    });
  });

  describe("status validation", () => {
    it("statusが'draft'の場合受け入れる", () => {
      const result = createFormSchema.safeParse({
        title: "テスト",
        status: "draft",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("draft");
      }
    });

    it("statusが'published'の場合受け入れる", () => {
      const result = createFormSchema.safeParse({
        title: "テスト",
        status: "published",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("published");
      }
    });

    it("statusが無効な値の場合エラー", () => {
      const result = createFormSchema.safeParse({
        title: "テスト",
        status: "invalid",
      });

      expect(result.success).toBe(false);
    });

    it("statusが省略された場合は'draft'がデフォルト", () => {
      const result = createFormSchema.safeParse({
        title: "テスト",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("draft");
      }
    });
  });

  describe("description validation", () => {
    it("descriptionが省略可能であることを確認", () => {
      const result = createFormSchema.safeParse({
        title: "テスト",
        status: "draft",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
      }
    });

    it("descriptionが文字列の場合受け入れる", () => {
      const result = createFormSchema.safeParse({
        title: "テスト",
        description: "説明文",
        status: "draft",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("説明文");
      }
    });

    it("descriptionが空文字列の場合も受け入れる", () => {
      const result = createFormSchema.safeParse({
        title: "テスト",
        description: "",
        status: "draft",
      });

      expect(result.success).toBe(true);
    });
  });
});
