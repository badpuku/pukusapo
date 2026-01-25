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

  layout("./routes/portal/layout.tsx", [
    route("portal", "./routes/portal/route.tsx"),
    route("portal/forms", "./routes/portal/forms/route.tsx", [
      index("./routes/portal/forms/index/route.tsx"),
      route(":id", "./routes/portal/forms/:id/route.tsx"),
    ]),
  ]),

  route("api/forms/create", "./routes/api/forms/create/route.tsx"),
  route("api/forms/:id/update", "./routes/api/forms/:id/update/route.tsx"),
  route("api/forms/:id/delete", "./routes/api/forms/:id/delete/route.tsx"),
] satisfies RouteConfig;
