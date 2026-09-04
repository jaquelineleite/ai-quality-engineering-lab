import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import { generateWithLLM } from "../ai/llm-client.js";
import { buildTestScenarioPrompt } from "../ai/prompts/test-scenario.prompt.js";

export function registerGenerateTestScenariosTool(
  server: McpServer
): void {
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
        const prompt = buildTestScenarioPrompt(requirement);
        const scenarios = await generateWithLLM(prompt, { temperature: 0.1, maxTokens: 220, timeoutMs: 120000 });

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
}
