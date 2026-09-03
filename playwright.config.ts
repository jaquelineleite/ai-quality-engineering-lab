import { defineConfig } from "@playwright/test";

export default defineConfig({
  timeout: 30000,

  retries: 1,

  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/results.json" }],
  ],

  projects: [
    {
      name: "serverest-api",
      testDir: "./tests/api",

      use: {
        baseURL: "https://serverest.dev",

        extraHTTPHeaders: {
          Accept: "application/json",
        },
      },
    },

    {
      name: "open-banking-api",
      testDir: "./tests/open-banking",

      use: {
        baseURL: "https://apisandbox.openbankproject.com",

        extraHTTPHeaders: {
          Accept: "application/json",
        },
      },
    },

    {
      name: "quality-gate",
      testDir: "./tests/quality",
    },
  ],
});
