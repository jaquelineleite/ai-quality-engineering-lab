import { test, expect } from "@playwright/test";

test.describe("Open Banking - Public Banks API", () => {
  test("should return the list of available banks", async ({ request }) => {
    const response = await request.get(
      "https://apisandbox.openbankproject.com/obp/v4.0.0/banks"
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body).toHaveProperty("banks");
    expect(Array.isArray(body.banks)).toBeTruthy();
    expect(body.banks.length).toBeGreaterThan(0);
  });
});