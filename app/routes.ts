import {
  index,
  layout,
  route,
  type RouteConfig,
} from "@react-router/dev/routes";

export default [
  index("./routes/_index.tsx"),

  layout("./routes/admin/layout.tsx", [
    route("admin", "./routes/admin/route.tsx"),
    route("admin/events", "./routes/admin/events.tsx"),
    route("admin/forms", "./routes/admin/forms/route.tsx", [
      index("./routes/admin/forms/index/route.tsx"),
      route("new", "./routes/admin/forms/new/route.tsx"),
      route(":id", "./routes/admin/forms/:id/route.tsx"),
    ]),
    route("admin/users", "./routes/admin/users.tsx"),
  ]),

  route("api/forms/create", "./routes/api/forms/create/route.tsx"),
  route("api/forms/:id/update", "./routes/api/forms/:id/update/route.tsx"),
] satisfies RouteConfig;
