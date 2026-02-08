import {
  index,
  layout,
  route,
  type RouteConfig,
} from "@react-router/dev/routes";

export default [
  index("./routes/_index.tsx"),

  // Admin - 管理画面
  layout("./routes/admin/layout.tsx", [
    route("admin", "./routes/admin/route.tsx"),
    route("admin/events", "./routes/admin/events.tsx"),

    // Admin - フォーム
    route("admin/forms", "./routes/admin/forms/route.tsx", [
      index("./routes/admin/forms/index/route.tsx"),
      route("new", "./routes/admin/forms/new/route.tsx"),
      route(":id", "./routes/admin/forms/:id/route.tsx"),
    ]),

    // Admin - 施設
    route("admin/facility", "./routes/admin/facility/route.tsx", [
      index("./routes/admin/facility/index/route.tsx"),

      // Admin - 施設アカウント
      route("accounts", "./routes/admin/facility/accounts/route.tsx", [
        index("./routes/admin/facility/accounts/index/route.tsx"),
        route("new", "./routes/admin/facility/accounts/new/route.tsx"),
        route(":id", "./routes/admin/facility/accounts/:id/route.tsx"),
      ]),

      // Admin - 予約結果収集ジョブ
      route("collection-jobs", "./routes/admin/facility/collection-jobs/route.tsx", [
        index("./routes/admin/facility/collection-jobs/index/route.tsx"),
      ]),
    ]),
    route("admin/users", "./routes/admin/users.tsx"),
  ]),

  // Portal - 一般利用画面
  layout("./routes/portal/layout.tsx", [
    route("portal", "./routes/portal/route.tsx"),
    route("portal/forms", "./routes/portal/forms/route.tsx", [
      index("./routes/portal/forms/index/route.tsx"),
      route(":id", "./routes/portal/forms/:id/route.tsx"),
    ]),
  ]),

  // API
  route("api/forms/create", "./routes/api/forms/create/route.tsx"),
  route("api/forms/:id/update", "./routes/api/forms/:id/update/route.tsx"),
  route("api/forms/:id/delete", "./routes/api/forms/:id/delete/route.tsx"),

  // API - 施設アカウント管理
  route(
    "api/facility/accounts",
    "./routes/api/facility/accounts/route.tsx",
  ),
  route(
    "api/facility/accounts/:id/update",
    "./routes/api/facility/accounts/:id/update/route.tsx",
  ),
  route(
    "api/facility/accounts/:id/delete",
    "./routes/api/facility/accounts/:id/delete/route.tsx",
  ),

  // API - 予約結果収集ジョブ
  route(
    "api/facility/collection-jobs",
    "./routes/api/facility/collection-jobs/route.tsx",
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
