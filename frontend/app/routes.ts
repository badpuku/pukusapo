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
    route("admin/facility", "./routes/admin/facility/route.tsx", [
      index("./routes/admin/facility/index/route.tsx"),
      route("accounts", "./routes/admin/facility/accounts/route.tsx", [
        index("./routes/admin/facility/accounts/index/route.tsx"),
        route("new", "./routes/admin/facility/accounts/new/route.tsx"),
        route(":id", "./routes/admin/facility/accounts/:id/route.tsx"),
      ]),
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

  route(
    "api/facility/accounts/create",
    "./routes/api/facility/accounts/create/route.tsx",
  ),
  route(
    "api/facility/accounts/:id/update",
    "./routes/api/facility/accounts/:id/update/route.tsx",
  ),
  route(
    "api/facility/accounts/:id/delete",
    "./routes/api/facility/accounts/:id/delete/route.tsx",
  ),
  route(
    "api/facility/collection-jobs/create",
    "./routes/api/facility/collection-jobs/create/route.tsx",
  ),
  route(
    "api/facility/collection-jobs/:id",
    "./routes/api/facility/collection-jobs/:id/route.tsx",
  ),
  
  route(
    "api/facility/reservations/create",
    "./routes/api/facility/reservations/create/route.tsx",
  ),
  route(
    "api/facility/reservations/:id/update",
    "./routes/api/facility/reservations/:id/update/route.tsx",
  ),
  route(
    "api/facility/reservations/:id/delete",
    "./routes/api/facility/reservations/:id/delete/route.tsx",
  ),
] satisfies RouteConfig;
