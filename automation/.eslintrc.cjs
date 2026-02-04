/**
 * automation固有のESLint設定
 * ルートの共通設定を継承
 */

/** @type {import('eslint').Linter.Config} */
module.exports = {
  env: {
    node: true,
  },
  ignorePatterns: ["dist/", ".wrangler/"],

  overrides: [
    // TypeScript - automation固有設定（tsconfigパス）
    {
      files: ["**/*.{ts,tsx}"],
      settings: {
        "import/resolver": {
          typescript: {
            project: "./tsconfig.json",
          },
        },
      },
    },

    // Node
    {
      files: [".eslintrc.cjs"],
      env: {
        node: true,
      },
    },
  ],
};
