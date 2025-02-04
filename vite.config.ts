import { cloudflareDevProxyVitePlugin as remixCloudflareDevProxy, vitePlugin as remix } from "react-router";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { getLoadContext } from "./load-context";

const isStorybook = process.argv[1]?.includes("storybook");

export default defineConfig({
  plugins: [
    remixCloudflareDevProxy({ getLoadContext }),
    !isStorybook &&
      remix({
        future: {
          v3_fetcherPersist: true,
          v3_relativeSplatPath: true,
          v3_throwAbortReason: true,
          v3_singleFetch: true,
          v3_lazyRouteDiscovery: true
        },
      }),
    tsconfigPaths(),
  ],
  server: {
    port: 3000,
  },
});
