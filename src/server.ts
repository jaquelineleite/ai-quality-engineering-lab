import "dotenv/config";
import { buildSelfHealingPrompt } from "./ai/prompts/self-healing.prompt.js";

import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

import { generateWithLLM } from "./ai/llm-client.js";
import { buildTestScenarioPrompt } from "./ai/prompts/test-scenario.prompt.js";
import { buildFailureAnalysisPrompt } from "./ai/prompts/failure-analysis.prompt.js";

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Funciona executando src/server.ts ou dist/server.js
const projectRoot = resolve(__dirname, "..");

const resultsDirectory = resolve(projectRoot, "test-results");
const resultsFile = resolve(resultsDirectory, "results.json");

const server = new McpServer({
  name: "ai-quality-engineering-lab",
  version: "1.0.0",
});

// -----------------------------------------------------------------------------
// TOOL 1 - GET QUALITY STATUS
// -----------------------------------------------------------------------------

server.registerTool(
  "get_quality_status",
  {
    description:
      "Returns the latest real quality status based on Playwright execution results.",

    inputSchema: z.object({
      project: z.string().describe("Project or application name"),

      environment: z
        .enum(["dev", "qa", "staging", "production"])
        .describe("Environment being evaluated"),
    }),
  },

  async ({ project, environment }) => {
    try {
      const reportContent = await readFile(resultsFile, "utf-8");
      const report = JSON.parse(reportContent);

      const stats = report.stats ?? {};

      const passed = stats.expected ?? 0;
      const failed = stats.unexpected ?? 0;
      const skipped = stats.skipped ?? 0;
      const flaky = stats.flaky ?? 0;

      const total = passed + failed + skipped + flaky;

      const passRate =
        total > 0
          ? Number(((passed / total) * 100).toFixed(2))
          : 0;

      const qualityGate =
        total === 0
          ? "ERROR"
          : failed > 0
            ? "FAILED"
            : "PASSED";

      const qualityStatus = {
        project,
        environment,

        status:
          qualityGate === "PASSED"
            ? "healthy"
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

        passRate: `${passRate}%`,
        qualityGate,

        source: "Playwright JSON Report",

        generatedAt: new Date().toISOString(),
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(qualityStatus, null, 2),
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

                generatedAt: new Date().toISOString(),
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

// -----------------------------------------------------------------------------
// TOOL 2 - RUN API TESTS
// -----------------------------------------------------------------------------

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
      const reportContent = await readFile(resultsFile, "utf-8");
      const report = JSON.parse(reportContent);

      const stats = report.stats ?? {};

      const passed = stats.expected ?? 0;
      const failed = stats.unexpected ?? 0;
      const skipped = stats.skipped ?? 0;
      const flaky = stats.flaky ?? 0;

      const total = passed + failed + skipped + flaky;

      const passRate =
        total > 0
          ? Number(((passed / total) * 100).toFixed(2))
          : 0;

      let qualityGate:
        | "PASSED"
        | "FAILED"
        | "ERROR";

      if (executionError || total === 0) {
        qualityGate = "ERROR";
      } else if (failed > 0) {
        qualityGate = "FAILED";
      } else {
        qualityGate = "PASSED";
      }

      const result = {
        suite: "API",
        framework: "Playwright",

        total,
        passed,
        failed,
        skipped,
        flaky,

        passRate: `${passRate}%`,
        qualityGate,

        execution: {
          successful: executionError === null,
          error: executionError,
        },

        stdout,
        stderr,

        workingDirectory: projectRoot,

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

                generatedAt: new Date().toISOString(),
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

// -----------------------------------------------------------------------------
// TOOL 3 - GENERATE TEST SCENARIOS
// -----------------------------------------------------------------------------

server.registerTool(
  "generate_test_scenarios",
  {
    description:
      "Generates risk-based QA test scenarios in BDD/Gherkin format using an LLM.",

    inputSchema: z.object({
      requirement: z
        .string()
        .min(10)
        .describe(
          "Software requirement or user story to analyze"
        ),
    }),
  },

  async ({ requirement }) => {
    try {
      const prompt =
        buildTestScenarioPrompt(requirement);

      const scenarios =
        await generateWithLLM(prompt);

      return {
        content: [
          {
            type: "text",
            text: scenarios,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                tool: "generate_test_scenarios",
                status: "ERROR",

                message:
                  error instanceof Error
                    ? error.message
                    : String(error),
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

// -----------------------------------------------------------------------------
// TOOL 4 - ANALYZE TEST FAILURE
// -----------------------------------------------------------------------------

server.registerTool(
  "analyze_test_failure",
  {
    description:
      "Analyzes a test failure using an LLM and returns probable root cause, category, evidence, recommended action and confidence.",

    inputSchema: z.object({
      failureDetails: z
        .string()
        .min(10)
        .describe(
          "Test failure details, error message, expected/actual result or execution evidence"
        ),
    }),
  },

  async ({ failureDetails }) => {
    try {
      const prompt =
        buildFailureAnalysisPrompt(
          failureDetails
        );

      const analysis =
        await generateWithLLM(prompt);

      return {
        content: [
          {
            type: "text",
            text: analysis,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                tool: "analyze_test_failure",
                status: "ERROR",

                message:
                  error instanceof Error
                    ? error.message
                    : String(error),
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

// -----------------------------------------------------------------------------
// START MCP SERVER
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// TOOL 5 - SELF HEALING ANALYSIS
// -----------------------------------------------------------------------------

server.registerTool(
  "self_healing_analysis",
  {
    description:
      "Analyzes a failed automated test and proposes a safe remediation without modifying code automatically.",

    inputSchema: z.object({
      failureDetails: z
        .string()
        .min(10)
        .describe(
          "Test failure details including expected/actual values and available evidence"
        ),
    }),
  },

  async ({ failureDetails }) => {
    try {
      const prompt =
        buildSelfHealingPrompt(failureDetails);

      const healingAnalysis =
        await generateWithLLM(prompt);

      return {
        content: [
          {
            type: "text",
            text: healingAnalysis,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                tool: "self_healing_analysis",
                status: "ERROR",
                message:
                  error instanceof Error
                    ? error.message
                    : String(error),
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

serveStdio(() => server);