import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import { generateWithLLM } from "../ai/llm-client.js";
import { buildSelfHealingPrompt } from "../ai/prompts/self-healing.prompt.js";

export function registerSelfHealingAnalysisTool(
  server: McpServer
): void {
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
        const prompt = buildSelfHealingPrompt(failureDetails);
        const healingAnalysis = await generateWithLLM(prompt);

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
}
