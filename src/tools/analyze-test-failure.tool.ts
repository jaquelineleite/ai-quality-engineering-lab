import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import { generateWithLLM } from "../ai/llm-client.js";
import { buildFailureAnalysisPrompt } from "../ai/prompts/failure-analysis.prompt.js";

export function registerAnalyzeTestFailureTool(
  server: McpServer
): void {
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
        const prompt = buildFailureAnalysisPrompt(failureDetails);
        const analysis = await generateWithLLM(prompt);

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
}
