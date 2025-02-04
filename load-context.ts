import { type AppLoadContext } from "react-router";
import { type PlatformProxy } from "wrangler";

// When using `wrangler.toml` to configure bindings,
// `wrangler types` will generate types for those bindings
// into the global `Env` interface.
// Need this empty interface so that typechecking passes
// even if no `wrangler.toml` exists.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Env {
  SESSION_SECRET: string;
  VITE_LINE_CLIENT_ID: string;
  VITE_LINE_CLIENT_SECRET: string;
  VITE_LINE_CALLBACK_URL: string;
  VITE_LINE_LOGIN_BASE_URL: string;
  VITE_LINE_TOKEN_BASE_URL: string;
  VITE_LINE_PROFILE_BASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

type Cloudflare = Omit<PlatformProxy<Env>, "dispose">;

declare module "react-router" {
  interface AppLoadContext {
    cloudflare: Cloudflare;
  }
}

type GetLoadContext = (args: {
  request: Request;
  context: { cloudflare: Cloudflare }; // load context _before_ augmentation
}) => AppLoadContext;

// Shared implementation compatible with Vite, Wrangler, and Cloudflare Pages
export const getLoadContext: GetLoadContext = ({ context }) => {
  return {
    ...context,
    extra: "stuff",
  };
};
