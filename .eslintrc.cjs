/**
 * ESLint共通設定（モノレポルート）
 * TypeScript + import-sort の基本設定を提供
 * 各ワークスペースは固有設定のみ上書き
 */

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  env: {
    es6: true,
  },

  // NOTE: prettier は他の設定の上書きを行うために、必ず最後に配置する
  extends: ["eslint:recommended", "prettier"],

  overrides: [
    // TypeScript
    {
      files: ["**/*.{ts,tsx}"],
      plugins: ["@typescript-eslint", "import", "simple-import-sort"],
      parser: "@typescript-eslint/parser",
      settings: {
        "import/internal-regex": "^~/",
        "import/resolver": {
          node: {
            extensions: [".ts", ".tsx"],
          },
          typescript: {
            alwaysTryTypes: true,
          },
        },
      },
      extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:import/recommended",
        "plugin:import/typescript",
        "prettier",
      ],
      rules: {
        "simple-import-sort/imports": "error",
        "simple-import-sort/exports": "error",
        "import/first": "error",
        "import/newline-after-import": "error",
        "import/no-duplicates": "error",
      },
    },

    // Node (設定ファイル等)
    {
      files: [".eslintrc.cjs", "**/*.config.{js,cjs,mjs}"],
      env: {
        node: true,
      },
    },
  ],
};
