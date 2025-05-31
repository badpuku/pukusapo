import * as Sentry from "@sentry/react";

export function initSentry() {
  const SENTRY_DSN = "https://e9ca26d4c21e18b8e55212d0ceac6e52@o4509416738455552.ingest.de.sentry.io/4509416938209360";
  Sentry.init({
    dsn: SENTRY_DSN,

    // Adds request headers and IP for users, for more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/react-router/configuration/options/#sendDefaultPii
    sendDefaultPii: true,
    integrations: [],
  });
}
