import { reactRouter } from "@react-router/dev/vite";
import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { getLoadContext } from "./load-context";

const isStorybook = process.argv[1]?.includes("storybook");

export default defineConfig({
  plugins: [
    cloudflareDevProxy({ getLoadContext }),
    !isStorybook && reactRouter(),
    tsconfigPaths(),
  ],
  server: {
    port: 3000,
  },
});
