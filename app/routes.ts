import { index, layout, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("./routes/_index.tsx"),

  layout("./routes/admin/layout.tsx", [
    route("admin/test", "./routes/admin/test.tsx"),
  ]),
  // ...(await flatRoutes()),
] satisfies RouteConfig;
