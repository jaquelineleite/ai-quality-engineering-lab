import "dotenv/config";

import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";

import { registerGetQualityStatusTool } from "./tools/get-quality-status.tool.js";
import { registerRunApiTestsTool } from "./tools/run-api-tests.tool.js";
import { registerGenerateTestScenariosTool } from "./tools/generate-test-scenarios.tool.js";
import { registerAnalyzeTestFailureTool } from "./tools/analyze-test-failure.tool.js";
import { registerSelfHealingAnalysisTool } from "./tools/self-healing-analysis.tool.js";
import { registerEvaluateQualityGateTool } from "./tools/evaluate-quality-gate.tool.js";

const server = new McpServer({
  name: "ai-quality-engineering-lab",
  version: "1.0.0",
});

registerGetQualityStatusTool(server);
registerRunApiTestsTool(server);
registerGenerateTestScenariosTool(server);
registerAnalyzeTestFailureTool(server);
registerSelfHealingAnalysisTool(server);
registerEvaluateQualityGateTool(server);

serveStdio(() => server);
