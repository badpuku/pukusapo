# デプロイメント - 本番環境での権限システム運用

## 🎯 この章で学ぶこと

- 本番環境でのセキュリティ設定
- 段階的デプロイメント戦略
- 監視とログ設定
- トラブルシューティング

## 🚀 デプロイメント戦略

### 1. **段階的デプロイメント**

```
開発環境 → ステージング環境 → 本番環境
    ↓           ↓            ↓
  機能開発    統合テスト    本番運用
  単体テスト   E2Eテスト    監視・運用
```

### 2. **環境別設定**

```typescript
// lib/config/environment.ts
export const config = {
  development: {
    database: {
      url: process.env.DEV_DATABASE_URL,
      ssl: false,
    },
    auth: {
      clerkPublishableKey: process.env.DEV_CLERK_PUBLISHABLE_KEY,
      clerkSecretKey: process.env.DEV_CLERK_SECRET_KEY,
    },
    security: {
      corsOrigins: ["http://localhost:3000"],
      rateLimiting: false,
    },
  },
  staging: {
    database: {
      url: process.env.STAGING_DATABASE_URL,
      ssl: true,
    },
    auth: {
      clerkPublishableKey: process.env.STAGING_CLERK_PUBLISHABLE_KEY,
      clerkSecretKey: process.env.STAGING_CLERK_SECRET_KEY,
    },
    security: {
      corsOrigins: ["https://staging.yourapp.com"],
      rateLimiting: true,
    },
  },
  production: {
    database: {
      url: process.env.DATABASE_URL,
      ssl: true,
      poolSize: 20,
    },
    auth: {
      clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY,
      clerkSecretKey: process.env.CLERK_SECRET_KEY,
    },
    security: {
      corsOrigins: ["https://yourapp.com"],
      rateLimiting: true,
      maxRequestsPerMinute: 100,
    },
    monitoring: {
      enabled: true,
      logLevel: "warn",
    },
  },
};

export const getConfig = () => {
  const env = process.env.NODE_ENV || "development";
  return config[env as keyof typeof config];
};
```

## 🛡️ セキュリティ設定

### 1. **環境変数の管理**

```bash
# .env.production (本番環境)
NODE_ENV=production

# データベース
DATABASE_URL=postgresql://user:password@db.example.com:5432/production_db
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 認証
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# セキュリティ
SESSION_SECRET=your-very-long-random-secret
ENCRYPTION_KEY=your-encryption-key

# 監視
SENTRY_DSN=https://...
LOG_LEVEL=warn
```

### 2. **セキュリティヘッダーの設定**

```typescript
// app/lib/security/headers.ts
export function getSecurityHeaders() {
  return {
    // XSS対策
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",

    // HTTPS強制
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",

    // CSP設定
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://clerk.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.clerk.com https://*.supabase.co",
      "frame-src https://clerk.com",
    ].join("; "),

    // その他
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
}

// app/entry.server.tsx
export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  // セキュリティヘッダーを追加
  const securityHeaders = getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    responseHeaders.set(key, value);
  });

  return new Promise((resolve, reject) => {
    // ... existing code
  });
}
```

### 3. **レート制限の実装**

```typescript
// app/lib/security/rateLimiter.ts
import { LRUCache } from "lru-cache";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
}

class RateLimiter {
  private cache: LRUCache<string, number[]>;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.cache = new LRUCache<string, number[]>({
      max: 10000,
      ttl: config.windowMs,
    });
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const requests = this.cache.get(identifier) || [];
    const validRequests = requests.filter((time) => time > windowStart);

    if (validRequests.length >= this.config.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.cache.set(identifier, validRequests);

    return true;
  }

  getRemainingRequests(identifier: string): number {
    const requests = this.cache.get(identifier) || [];
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const validRequests = requests.filter((time) => time > windowStart);

    return Math.max(0, this.config.maxRequests - validRequests.length);
  }
}

// 用途別のレート制限設定
export const rateLimiters = {
  api: new RateLimiter({
    windowMs: 60 * 1000, // 1分
    maxRequests: 100,
  }),
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15分
    maxRequests: 5, // ログイン試行
  }),
  admin: new RateLimiter({
    windowMs: 60 * 1000, // 1分
    maxRequests: 30, // 管理者操作
  }),
};

// ミドルウェアとして使用
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return async (request: Request) => {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!limiter.isAllowed(ip)) {
      throw new Response("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Remaining": "0",
        },
      });
    }

    return {
      "X-RateLimit-Remaining": limiter.getRemainingRequests(ip).toString(),
    };
  };
}
```

## 📊 監視とログ設定

### 1. **構造化ログの実装**

```typescript
// app/lib/logging/logger.ts
import winston from "winston";

interface LogContext {
  userId?: string;
  action?: string;
  resource?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
  error?: Error;
}

class Logger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
        }),
        new winston.transports.File({
          filename: "logs/combined.log",
        }),
      ],
    });
  }

  info(message: string, context?: LogContext) {
    this.logger.info(message, context);
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(message, context);
  }

  error(message: string, context?: LogContext) {
    this.logger.error(message, context);
  }

  // セキュリティ関連の特別なログ
  security(event: string, context: LogContext) {
    this.logger.warn(`SECURITY: ${event}`, {
      ...context,
      security: true,
      timestamp: new Date().toISOString(),
    });
  }

  // 権限チェックのログ
  permission(result: boolean, permission: string, context: LogContext) {
    this.logger.info(
      `PERMISSION_CHECK: ${permission} - ${result ? "ALLOWED" : "DENIED"}`,
      {
        ...context,
        permission,
        result,
      },
    );
  }
}

export const logger = new Logger();

// 使用例
export function logPermissionCheck(
  userId: string,
  permission: string,
  result: boolean,
  request: Request,
) {
  logger.permission(result, permission, {
    userId,
    ip: request.headers.get("x-forwarded-for") || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
  });
}

export function logSecurityEvent(
  event: string,
  userId: string,
  request: Request,
  details?: any,
) {
  logger.security(event, {
    userId,
    ip: request.headers.get("x-forwarded-for") || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
    details,
  });
}
```

### 2. **メトリクス収集**

```typescript
// app/lib/monitoring/metrics.ts
class MetricsCollector {
  private metrics: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  // カウンターメトリクス
  increment(name: string, value: number = 1, tags?: Record<string, string>) {
    const key = this.createKey(name, tags);
    this.metrics.set(key, (this.metrics.get(key) || 0) + value);
  }

  // ヒストグラムメトリクス（レスポンス時間など）
  histogram(name: string, value: number, tags?: Record<string, string>) {
    const key = this.createKey(name, tags);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
  }

  // 権限チェック関連のメトリクス
  recordPermissionCheck(permission: string, result: boolean, duration: number) {
    this.increment("permission_checks_total", 1, {
      permission,
      result: result.toString(),
    });
    this.histogram("permission_check_duration", duration, { permission });
  }

  // 認証関連のメトリクス
  recordAuthEvent(event: "login" | "logout" | "failed_login", userId?: string) {
    this.increment("auth_events_total", 1, { event });
  }

  // API使用量のメトリクス
  recordApiCall(
    endpoint: string,
    method: string,
    status: number,
    duration: number,
  ) {
    this.increment("api_calls_total", 1, {
      endpoint,
      method,
      status: status.toString(),
    });
    this.histogram("api_response_time", duration, { endpoint, method });
  }

  private createKey(name: string, tags?: Record<string, string>): string {
    if (!tags) return name;
    const tagString = Object.entries(tags)
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
    return `${name}{${tagString}}`;
  }

  // メトリクスをPrometheus形式で出力
  getPrometheusMetrics(): string {
    const lines: string[] = [];

    // カウンターメトリクス
    for (const [key, value] of this.metrics) {
      lines.push(`${key} ${value}`);
    }

    // ヒストグラムメトリクス（簡易版）
    for (const [key, values] of this.histograms) {
      const sum = values.reduce((a, b) => a + b, 0);
      const count = values.length;
      const avg = sum / count;

      lines.push(`${key}_sum ${sum}`);
      lines.push(`${key}_count ${count}`);
      lines.push(`${key}_avg ${avg}`);
    }

    return lines.join("\n");
  }
}

export const metrics = new MetricsCollector();

// メトリクス収集用のミドルウェア
export function createMetricsMiddleware() {
  return async (request: Request, next: () => Promise<Response>) => {
    const start = Date.now();
    const url = new URL(request.url);

    try {
      const response = await next();
      const duration = Date.now() - start;

      metrics.recordApiCall(
        url.pathname,
        request.method,
        response.status,
        duration,
      );

      return response;
    } catch (error) {
      const duration = Date.now() - start;

      metrics.recordApiCall(url.pathname, request.method, 500, duration);

      throw error;
    }
  };
}
```

### 3. **ヘルスチェックエンドポイント**

```typescript
// app/routes/health.tsx
import { json } from "@remix-run/node";
import { supabase } from "~/lib/db/supabase";
import { metrics } from "~/lib/monitoring/metrics";

export async function loader() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: "healthy",
    checks: {
      database: "unknown",
      auth: "unknown",
      permissions: "unknown",
    },
    version: process.env.APP_VERSION || "unknown",
  };

  try {
    // データベース接続チェック
    const { error: dbError } = await supabase
      .from("roles")
      .select("count")
      .limit(1)
      .single();

    checks.checks.database = dbError ? "unhealthy" : "healthy";

    // 権限システムの基本チェック
    const { error: permError } = await supabase
      .from("permissions")
      .select("count")
      .limit(1)
      .single();

    checks.checks.permissions = permError ? "unhealthy" : "healthy";

    // 認証システムのチェック（Clerkの場合は簡易チェック）
    checks.checks.auth = process.env.CLERK_SECRET_KEY ? "healthy" : "unhealthy";

    // 全体的なステータス判定
    const allHealthy = Object.values(checks.checks).every(
      (status) => status === "healthy",
    );
    checks.status = allHealthy ? "healthy" : "unhealthy";
  } catch (error) {
    checks.status = "unhealthy";
    console.error("Health check failed:", error);
  }

  const statusCode = checks.status === "healthy" ? 200 : 503;
  return json(checks, { status: statusCode });
}

// メトリクスエンドポイント
export async function action() {
  const metricsData = metrics.getPrometheusMetrics();

  return new Response(metricsData, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
```

## 🚀 デプロイメント自動化

### 1. **GitHub Actions でのデプロイメント**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:ci
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to staging
        run: |
          # Vercel/Netlify/Railway等へのデプロイ
          npm run deploy:staging
        env:
          DEPLOY_TOKEN: ${{ secrets.STAGING_DEPLOY_TOKEN }}

      - name: Run E2E tests on staging
        run: npm run test:e2e:staging
        env:
          STAGING_URL: ${{ secrets.STAGING_URL }}

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to production
        run: |
          npm run deploy:production
        env:
          DEPLOY_TOKEN: ${{ secrets.PRODUCTION_DEPLOY_TOKEN }}

      - name: Run smoke tests
        run: npm run test:smoke
        env:
          PRODUCTION_URL: ${{ secrets.PRODUCTION_URL }}

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 2. **データベースマイグレーション**

```typescript
// scripts/migrate.ts
import { createClient } from "@supabase/supabase-js";

interface MigrationConfig {
  supabaseUrl: string;
  supabaseKey: string;
  environment: "staging" | "production";
}

async function runMigrations(config: MigrationConfig) {
  const supabase = createClient(config.supabaseUrl, config.supabaseKey);

  console.log(`Running migrations for ${config.environment}...`);

  try {
    // 1. バックアップの作成（本番環境のみ）
    if (config.environment === "production") {
      console.log("Creating backup...");
      // バックアップ処理
    }

    // 2. マイグレーションの実行
    console.log("Applying migrations...");

    // 権限システムの更新があるかチェック
    const { data: currentVersion } = await supabase
      .from("schema_migrations")
      .select("version")
      .order("version", { ascending: false })
      .limit(1);

    // 新しいマイグレーションがあれば実行
    const pendingMigrations = await getPendingMigrations(
      currentVersion?.version,
    );

    for (const migration of pendingMigrations) {
      console.log(`Applying migration: ${migration.name}`);
      await migration.up(supabase);

      // マイグレーション記録
      await supabase.from("schema_migrations").insert({
        version: migration.version,
        name: migration.name,
        applied_at: new Date().toISOString(),
      });
    }

    // 3. 権限データの整合性チェック
    console.log("Validating permissions...");
    await validatePermissions(supabase);

    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);

    // 本番環境の場合はロールバック
    if (config.environment === "production") {
      console.log("Rolling back...");
      // ロールバック処理
    }

    process.exit(1);
  }
}

async function validatePermissions(supabase: any) {
  // 必須ロールの存在確認
  const requiredRoles = ["user", "moderator", "admin"];
  const { data: roles } = await supabase
    .from("roles")
    .select("code")
    .in("code", requiredRoles);

  const existingRoles = roles?.map((r) => r.code) || [];
  const missingRoles = requiredRoles.filter(
    (role) => !existingRoles.includes(role),
  );

  if (missingRoles.length > 0) {
    throw new Error(`Missing required roles: ${missingRoles.join(", ")}`);
  }

  // 権限の整合性チェック
  const { data: orphanedPermissions } = await supabase
    .from("role_permissions")
    .select(
      `
      id,
      roles!inner(id),
      permissions!inner(id)
    `,
    )
    .is("roles.id", null)
    .or("permissions.id", null);

  if (orphanedPermissions && orphanedPermissions.length > 0) {
    console.warn(
      `Found ${orphanedPermissions.length} orphaned role_permissions`,
    );
    // 孤立した権限を削除
    await supabase
      .from("role_permissions")
      .delete()
      .in(
        "id",
        orphanedPermissions.map((p) => p.id),
      );
  }
}

// 実行
const config: MigrationConfig = {
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  environment: (process.env.NODE_ENV as any) || "staging",
};

runMigrations(config);
```

## 🔍 監視とアラート

### 1. **エラー監視（Sentry）**

```typescript
// app/lib/monitoring/sentry.ts
import * as Sentry from "@sentry/remix";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,

  beforeSend(event) {
    // 機密情報をフィルタリング
    if (event.request?.data) {
      delete event.request.data.password;
      delete event.request.data.token;
    }

    return event;
  },

  integrations: [new Sentry.Integrations.Http({ tracing: true })],
});

// 権限エラーの特別な処理
export function capturePermissionError(
  error: Error,
  context: {
    userId: string;
    permission: string;
    resource?: string;
  },
) {
  Sentry.withScope((scope) => {
    scope.setTag("error_type", "permission_denied");
    scope.setContext("permission", context);
    Sentry.captureException(error);
  });
}

// セキュリティイベントの記録
export function captureSecurityEvent(
  event: string,
  context: {
    userId?: string;
    ip: string;
    userAgent: string;
    severity: "low" | "medium" | "high";
  },
) {
  Sentry.withScope((scope) => {
    scope.setTag("event_type", "security");
    scope.setLevel(context.severity === "high" ? "error" : "warning");
    scope.setContext("security", context);
    Sentry.captureMessage(`Security event: ${event}`);
  });
}
```

### 2. **アラート設定**

```typescript
// app/lib/monitoring/alerts.ts
interface AlertRule {
  name: string;
  condition: (metrics: any) => boolean;
  severity: "low" | "medium" | "high" | "critical";
  cooldown: number; // 分
}

const alertRules: AlertRule[] = [
  {
    name: "High Permission Denial Rate",
    condition: (metrics) => {
      const denialRate = metrics.permission_denials / metrics.permission_checks;
      return denialRate > 0.3; // 30%以上の拒否率
    },
    severity: "medium",
    cooldown: 15,
  },
  {
    name: "Excessive Failed Login Attempts",
    condition: (metrics) => {
      return metrics.failed_logins_last_hour > 50;
    },
    severity: "high",
    cooldown: 5,
  },
  {
    name: "Potential Privilege Escalation",
    condition: (metrics) => {
      return metrics.role_changes_last_hour > 10;
    },
    severity: "critical",
    cooldown: 0, // 即座に通知
  },
  {
    name: "Database Connection Issues",
    condition: (metrics) => {
      return metrics.db_errors_last_5min > 5;
    },
    severity: "critical",
    cooldown: 1,
  },
];

class AlertManager {
  private lastAlerts = new Map<string, number>();

  async checkAlerts(metrics: any) {
    const now = Date.now();

    for (const rule of alertRules) {
      if (rule.condition(metrics)) {
        const lastAlert = this.lastAlerts.get(rule.name) || 0;
        const cooldownMs = rule.cooldown * 60 * 1000;

        if (now - lastAlert > cooldownMs) {
          await this.sendAlert(rule, metrics);
          this.lastAlerts.set(rule.name, now);
        }
      }
    }
  }

  private async sendAlert(rule: AlertRule, metrics: any) {
    const message = {
      alert: rule.name,
      severity: rule.severity,
      timestamp: new Date().toISOString(),
      metrics: metrics,
    };

    // Slack通知
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🚨 Alert: ${rule.name}`,
          attachments: [
            {
              color: this.getSeverityColor(rule.severity),
              fields: [
                { title: "Severity", value: rule.severity, short: true },
                { title: "Time", value: message.timestamp, short: true },
              ],
            },
          ],
        }),
      });
    }

    // メール通知（重要度が高い場合）
    if (rule.severity === "critical" || rule.severity === "high") {
      // メール送信処理
    }
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case "critical":
        return "danger";
      case "high":
        return "warning";
      case "medium":
        return "good";
      default:
        return "#808080";
    }
  }
}

export const alertManager = new AlertManager();
```

## 🔧 トラブルシューティング

### 1. **よくある問題と解決方法**

```typescript
// app/lib/troubleshooting/diagnostics.ts
export class PermissionDiagnostics {
  // ユーザーの権限状態を詳細に調査
  async diagnoseUserPermissions(userId: string) {
    const diagnosis = {
      userId,
      timestamp: new Date().toISOString(),
      issues: [] as string[],
      recommendations: [] as string[],
      details: {} as any,
    };

    try {
      // 1. ユーザーの存在確認
      const { data: user } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!user) {
        diagnosis.issues.push("ユーザーが見つかりません");
        diagnosis.recommendations.push(
          "ユーザーの作成またはClerkとの同期を確認",
        );
        return diagnosis;
      }

      diagnosis.details.user = user;

      // 2. アクティブ状態の確認
      if (!user.is_active) {
        diagnosis.issues.push("ユーザーが非アクティブです");
        diagnosis.recommendations.push("ユーザーをアクティブ化してください");
      }

      // 3. ロールの確認
      const { data: role } = await supabase
        .from("roles")
        .select("*")
        .eq("id", user.role_id)
        .single();

      if (!role) {
        diagnosis.issues.push("ロールが見つかりません");
        diagnosis.recommendations.push("有効なロールを割り当ててください");
      } else {
        diagnosis.details.role = role;

        if (!role.is_active) {
          diagnosis.issues.push("割り当てられたロールが非アクティブです");
          diagnosis.recommendations.push(
            "ロールをアクティブ化するか、別のロールを割り当ててください",
          );
        }
      }

      // 4. 権限の確認
      const { data: permissions } = await supabase
        .from("role_permissions")
        .select(
          `
          permissions (
            id,
            code,
            name,
            is_active
          )
        `,
        )
        .eq("role_id", user.role_id);

      const activePermissions =
        permissions?.filter((p) => p.permissions.is_active) || [];

      diagnosis.details.permissions = activePermissions;

      if (activePermissions.length === 0) {
        diagnosis.issues.push("有効な権限がありません");
        diagnosis.recommendations.push("ロールに権限を割り当ててください");
      }

      // 5. RLSポリシーの確認
      const rlsCheck = await this.checkRLSPolicies(userId);
      if (!rlsCheck.working) {
        diagnosis.issues.push("RLSポリシーが正しく動作していません");
        diagnosis.recommendations.push("RLSポリシーの設定を確認してください");
      }
    } catch (error) {
      diagnosis.issues.push(`診断中にエラーが発生: ${error.message}`);
      diagnosis.recommendations.push("システム管理者に連絡してください");
    }

    return diagnosis;
  }

  // RLSポリシーの動作確認
  async checkRLSPolicies(userId: string) {
    try {
      // テストクエリを実行してRLSが正常に動作するかチェック
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId);

      return {
        working: !error && data && data.length > 0,
        error: error?.message,
      };
    } catch (error) {
      return {
        working: false,
        error: error.message,
      };
    }
  }

  // システム全体の健全性チェック
  async systemHealthCheck() {
    const health = {
      timestamp: new Date().toISOString(),
      overall: "healthy" as "healthy" | "degraded" | "unhealthy",
      components: {} as Record<string, any>,
    };

    // データベース接続
    try {
      await supabase.from("roles").select("count").limit(1);
      health.components.database = { status: "healthy" };
    } catch (error) {
      health.components.database = {
        status: "unhealthy",
        error: error.message,
      };
      health.overall = "unhealthy";
    }

    // 権限システムの整合性
    try {
      const { data: orphanedRolePermissions } = await supabase
        .from("role_permissions")
        .select("id")
        .not("role_id", "in", `(SELECT id FROM roles)`)
        .not("permission_id", "in", `(SELECT id FROM permissions)`);

      health.components.permissions = {
        status: orphanedRolePermissions?.length === 0 ? "healthy" : "degraded",
        orphanedRecords: orphanedRolePermissions?.length || 0,
      };

      if (orphanedRolePermissions?.length > 0) {
        health.overall = "degraded";
      }
    } catch (error) {
      health.components.permissions = {
        status: "unhealthy",
        error: error.message,
      };
      health.overall = "unhealthy";
    }

    return health;
  }
}

export const diagnostics = new PermissionDiagnostics();
```

### 2. **デバッグ用エンドポイント**

```typescript
// app/routes/admin/debug/permissions.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireRole } from "~/lib/auth/middleware";
import { diagnostics } from "~/lib/troubleshooting/diagnostics";

export async function loader({ request }: LoaderFunctionArgs) {
  // 管理者のみアクセス可能
  await requireRole(request, "admin");

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const action = url.searchParams.get("action") || "health";

  let result;

  switch (action) {
    case "user":
      if (!userId) {
        throw new Error("User ID is required");
      }
      result = await diagnostics.diagnoseUserPermissions(userId);
      break;

    case "health":
      result = await diagnostics.systemHealthCheck();
      break;

    default:
      throw new Error("Invalid action");
  }

  return json(result);
}

export default function PermissionDebug() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">権限システム診断</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <pre className="text-sm overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
```

## 🤔 よくある質問

### Q1: 本番環境でのパフォーマンス最適化は？

**A:**

- 権限情報のキャッシュ
- データベースインデックスの最適化
- CDNの活用
- レスポンス圧縮

### Q2: セキュリティインシデント発生時の対応は？

**A:**

1. 即座にアカウント無効化
2. ログの詳細調査
3. 影響範囲の特定
4. セキュリティパッチの適用

### Q3: スケーリング時の注意点は？

**A:**

- データベース接続プールの調整
- キャッシュ戦略の見直し
- 負荷分散の考慮
- 監視メトリクスの追加

### Q4: 災害復旧の準備は？

**A:**

- 定期的なバックアップ
- 復旧手順の文書化
- テスト環境での復旧演習
- RTO/RPOの設定

---

**前へ**: [テスト](./08-testing.md) ←  
**次へ**: [まとめ](./10-conclusion.md) →
