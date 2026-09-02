import { test, expect } from "@playwright/test";

test.describe("API Health Check", () => {
  test("should return users successfully", async ({ request }) => {
    const response = await request.get("/usuarios");

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body).toHaveProperty("usuarios");
    expect(Array.isArray(body.usuarios)).toBeTruthy();
  });
});