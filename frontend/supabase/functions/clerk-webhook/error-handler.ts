export const handleWebhookError = (error: unknown): Response => {
  console.error("💥 Webhook processing error:", error);

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorName = error instanceof Error ? error.name : "Unknown";
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error("Error details:", {
    name: errorName,
    message: errorMessage,
    stack: errorStack,
  });

  // 401エラーの場合は詳細をログ出力
  if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
    console.error("401 Unauthorized error detected");
    console.error("This could be due to:");
    console.error("  - Invalid webhook signature");
    console.error("  - Invalid Supabase service role key");
    console.error("  - Missing or incorrect environment variables");
  }

  return new Response(
    JSON.stringify({
      error: "Internal server error",
      details: errorMessage,
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
};