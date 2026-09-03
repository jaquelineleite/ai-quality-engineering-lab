import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import { evaluateQualityGate } from "../quality/quality-gate.js";

export function registerEvaluateQualityGateTool(
  server: McpServer
): void {
  server.registerTool(
    "evaluate_quality_gate",
    {
      description:
        "Evaluates automated test metrics against Quality Engineering quality gates.",

      inputSchema: z.object({
        total: z.number().int().min(0),
        passed: z.number().int().min(0),
        failed: z.number().int().min(0),
        skipped: z.number().int().min(0),
        flaky: z.number().int().min(0),
      }),
    },

    async ({ total, passed, failed, skipped, flaky }) => {
      const result = evaluateQualityGate({
        total,
        passed,
        failed,
        skipped,
        flaky,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: result.status === "ERROR",
      };
    }
  );
}
