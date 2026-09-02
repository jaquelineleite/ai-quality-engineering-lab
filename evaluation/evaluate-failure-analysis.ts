import "dotenv/config";

import { readFile, writeFile } from "node:fs/promises";
import { generateWithLLM } from "../src/ai/llm-client.js";
import { buildFailureAnalysisPrompt } from "../src/ai/prompts/failure-analysis.prompt.js";

type GoldenCase = {
  id: string;
  input: {
    failureDetails: string;
  };
  expected: {
    category: string;
    mustContainEvidence: string[];
    allowedConfidence: string[];
  };
};

function extractField(
  response: string,
  field: string
): string {
  const line = response
    .split("\n")
    .find((item) =>
      item.trim().startsWith(`${field}:`)
    );

  if (!line) {
    return "";
  }

  return line
    .slice(line.indexOf(":") + 1)
    .trim();
}

async function main() {
  const datasetContent = await readFile(
    "evaluation/golden-dataset/failure-analysis.json",
    "utf-8"
  );

  const dataset =
    JSON.parse(datasetContent) as GoldenCase[];

  let accumulatedScore = 0;

  for (const testCase of dataset) {
    const prompt =
      buildFailureAnalysisPrompt(
        testCase.input.failureDetails
      );

    const response =
        await generateWithLLM(prompt, {
         temperature: 0,
            maxTokens: 300,
        });

    const category =
      extractField(response, "CATEGORY");

    const confidence =
      extractField(response, "CONFIDENCE");

    const evidence =
      extractField(response, "EVIDENCE");

    const categoryPassed =
      category ===
      testCase.expected.category;

    const confidencePassed =
      testCase.expected.allowedConfidence.includes(
        confidence
      );

    const evidencePassed =
      testCase.expected.mustContainEvidence.every(
        (expectedEvidence) =>
          evidence
            .toLowerCase()
            .includes(
              expectedEvidence.toLowerCase()
            )
      );

    const checks = [
      categoryPassed,
      evidencePassed,
      confidencePassed,
    ];

    const passedChecks =
      checks.filter(Boolean).length;

    const caseScore =
      Number(
        (
          (passedChecks / checks.length) *
          100
        ).toFixed(2)
      );

    accumulatedScore += caseScore;

    console.log(
      JSON.stringify(
        {
          id: testCase.id,

          score: `${caseScore}%`,

          checks: {
            category: {
              passed: categoryPassed,
              score: categoryPassed
                ? "100%"
                : "0%",
            },

            evidence: {
              passed: evidencePassed,
              score: evidencePassed
                ? "100%"
                : "0%",
            },

            confidence: {
              passed: confidencePassed,
              score: confidencePassed
                ? "100%"
                : "0%",
            },
          },

          expected:
            testCase.expected,

          actual: {
            category,
            evidence,
            confidence,
          },
        },
        null,
        2
      )
    );
  }

  const finalScore =
    dataset.length > 0
      ? Number(
          (
            accumulatedScore /
            dataset.length
          ).toFixed(2)
        )
      : 0;

  const finalResult = {
  evaluation: "failure-analysis",
  totalCases: dataset.length,
  score: `${finalScore}%`,
  qualityGate:
    finalScore >= 80
      ? "PASSED"
      : "FAILED",
  generatedAt: new Date().toISOString(),
};

console.log(
  JSON.stringify(
    finalResult,
    null,
    2
  )
);

await writeFile(
  "evaluation/results/failure-analysis.json",
  JSON.stringify(
    finalResult,
    null,
    2
  ),
  "utf-8"
);
  }

main().catch((error) => {
  console.error(
    "Evaluation failed:",
    error
  );

  process.exit(1);
});