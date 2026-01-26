import { defineWorkersProject } from '@cloudflare/vitest-pool-workers/config'
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineWorkersProject(() => {
  return {
    plugins: [tsconfigPaths()],
    test: {
      poolOptions: {
        workers: {
          wrangler: { configPath: './wrangler.jsonc' },
        },
      },
    },
  }
})
