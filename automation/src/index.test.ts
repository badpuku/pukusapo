import { describe, expect, it } from "vitest";

import app from "~/index";

describe("GET /", () => {
  it("正常系: API情報を返す", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("status", "ok");
    expect(data).toHaveProperty("message", "Reservation Collector API");
    expect(data).toHaveProperty("endpoints");
  });
});
