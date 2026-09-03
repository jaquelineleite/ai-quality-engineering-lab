import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { evaluateQualityGate } from "../quality/quality-gate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = resolve(__dirname, "../..");
const resultsFile = resolve(
  projectRoot,
  "test-results",
  "results.json"
);

export function registerGetQualityStatusTool(
  server: McpServer
): void {
  server.registerTool(
    "get_quality_status",
    {
      description:
        "Returns the latest real quality status based on Playwright execution results.",

      inputSchema: z.object({
        project: z
          .string()
          .describe("Project or application name"),

        environment: z
          .enum([
            "dev",
            "qa",
            "staging",
            "production",
          ])
          .describe("Environment being evaluated"),
      }),
    },

    async ({ project, environment }) => {
      try {
        const reportContent = await readFile(
          resultsFile,
          "utf-8"
        );

        const report = JSON.parse(reportContent);
        const stats = report.stats ?? {};

        const passed = stats.expected ?? 0;
        const failed = stats.unexpected ?? 0;
        const skipped = stats.skipped ?? 0;
        const flaky = stats.flaky ?? 0;

        const total =
          passed + failed + skipped + flaky;

        const gateResult = evaluateQualityGate({
          total,
          passed,
          failed,
          skipped,
          flaky,
        });

        const qualityGate = gateResult.status;

        const qualityStatus = {
          project,
          environment,

          status:
            qualityGate === "PASSED"
              ? "healthy"
              : qualityGate === "WARNING"
                ? "degraded"
                : qualityGate === "FAILED"
                  ? "unhealthy"
                  : "unknown",

          automatedTests: {
            total,
            passed,
            failed,
            skipped,
            flaky,
          },

          passRate: `${gateResult.passRate}%`,
          qualityGate,

          source: "Playwright JSON Report",

          generatedAt: new Date().toISOString(),
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                qualityStatus,
                null,
                2
              ),
            },
          ],

          isError: qualityGate === "ERROR",
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  project,
                  environment,
                  status: "unknown",
                  qualityGate: "ERROR",
                  message:
                    "No valid Playwright execution report was found.",
                  error:
                    error instanceof Error
                      ? error.message
                      : String(error),
                  generatedAt:
                    new Date().toISOString(),
                },
                null,
                2
              ),
            },
          ],

          isError: true,
        };
      }
    }
  );
}
