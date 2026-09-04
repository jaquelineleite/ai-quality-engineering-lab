export function buildTestScenarioPrompt(requirement: string): string {
  return `
You are a Senior Quality Engineer.

Requirement:
${requirement}

Generate exactly 3 concise BDD test scenarios:
1. Positive
2. Negative
3. Boundary

Use exactly this format for each scenario:

SCENARIO: <short title>
GIVEN: <short precondition>
WHEN: <short action>
THEN: <short expected result>
RISK: LOW | MEDIUM | HIGH

Keep every line concise.
Do not use Markdown bullets.
Do not add explanations.
Return only the 3 scenarios.
`;
}
