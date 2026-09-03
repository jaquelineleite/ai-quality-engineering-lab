import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { evaluateQualityGate } from "../quality/quality-gate.js";

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = resolve(__dirname, "../..");
const resultsDirectory = resolve(projectRoot, "test-results");
const resultsFile = resolve(resultsDirectory, "results.json");

export function registerRunApiTestsTool(
  server: McpServer
): void {
  server.registerTool(
    "run_api_tests",
    {
      description:
        "Runs the Playwright API automated test suite and returns real execution metrics.",

      inputSchema: z.object({}),
    },

    async () => {
      await mkdir(resultsDirectory, {
        recursive: true,
      });

      await rm(resultsFile, { force: true });

      const playwrightCli = resolve(
        projectRoot,
        "node_modules",
        "@playwright",
        "test",
        "cli.js"
      );

      let executionError: string | null = null;
      let stdout = "";
      let stderr = "";

      try {
        const execution = await execFileAsync(
          process.execPath,
          [
            playwrightCli,
            "test",
            "--config=playwright.config.ts",
          ],
          {
            cwd: projectRoot,
            windowsHide: true,
            maxBuffer: 10 * 1024 * 1024,
            env: process.env,
          }
        );

        stdout = execution.stdout;
        stderr = execution.stderr;
      } catch (error: unknown) {
        const processError = error as Error & {
          stdout?: string;
          stderr?: string;
        };

        stdout = processError.stdout ?? "";
        stderr = processError.stderr ?? "";

        executionError =
          stderr ||
          processError.message ||
          String(error);
      }

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

        const qualityGate =
          executionError !== null && failed === 0
            ? "ERROR"
            : gateResult.status;

        const result = {
          suite: "API",
          framework: "Playwright",

          total,
          passed,
          failed,
          skipped,
          flaky,

          passRate: `${gateResult.passRate}%`,
          qualityGate,
          qualityGateDetails: gateResult,

          execution: {
            successful: executionError === null,
            error: executionError,
          },

          stdout,
          stderr,

          generatedAt: new Date().toISOString(),
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
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
                  suite: "API",
                  framework: "Playwright",
                  qualityGate: "ERROR",
                  message:
                    "Could not read Playwright test results.",
                  executionError,
                  stdout,
                  stderr,
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
