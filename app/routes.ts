import { index, route, type RouteConfig } from "@react-router/dev/routes";
// import { flatRoutes } from "@react-router/fs-routes";

export default [
  index("./routes/_index.tsx"),
  route("api/webhooks/clerk/user", "./routes/api/webhooks/clerk/user/route.ts"),
  // ...(await flatRoutes()),
] satisfies RouteConfig;
