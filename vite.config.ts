import { reactRouter } from "@react-router/dev/vite";
import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import path from 'path';
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const isStorybook = process.argv[1]?.includes("storybook");

export default defineConfig(({ isSsrBuild, mode }) => ({
  build: {
    rollupOptions: isSsrBuild
      ? {
          input: "./workers/app.ts",
        }
      : undefined,
  },
  plugins: [
    cloudflareDevProxy({
      getLoadContext({ context }) {
        return { cloudflare: context.cloudflare };
      },
    }),
    tailwindcss(),
    !isStorybook && reactRouter(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      ...(mode === 'development' && { 'postgres': path.resolve(__dirname, 'node_modules/postgres/src/index.js') })
    }
  },
  server: {
    port: 3000,
  },
}));
