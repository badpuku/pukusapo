import { index, layout, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("./routes/_index.tsx"),

  layout("./routes/admin/layout.tsx", [
    route("admin", "./routes/admin/route.tsx"),
    route("admin/events", "./routes/admin/events.tsx"),
    route("admin/forms", "./routes/admin/forms/route.tsx"),
    route("admin/forms/new", "./routes/admin/forms/new.tsx"),
    route("admin/users", "./routes/admin/users.tsx"),
  ]),
] satisfies RouteConfig;
