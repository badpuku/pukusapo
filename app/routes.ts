import { index, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("./routes/_index.tsx"),
  // ...(await flatRoutes()),
] satisfies RouteConfig;
