import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { config } from "dotenv";
import path from "path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const isStorybook = process.argv[1]?.includes("storybook");

config({ path: path.resolve(process.cwd(), "supabase/.env") });

export default defineConfig(({ mode }) => ({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    !isStorybook && reactRouter(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      ...(mode === "development" && {
        postgres: path.resolve(__dirname, "node_modules/postgres/src/index.js"),
      }),
    },
  },
  server: {
    port: 3000,
    // NOTE: ローカルで開発する場合は、Clerkのドメインを許可する
    ...(mode === "development" && {
      allowedHosts: [process.env.CLERK_DOMAIN || ""],
    }),
  },
}));
