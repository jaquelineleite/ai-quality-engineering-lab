export function buildTestScenarioPrompt(requirement: string): string {
  return `
You are a Senior Quality Engineer.

Analyze the requirement below:

${requirement}

Generate only 3 concise BDD/Gherkin test scenarios:

1. One positive scenario
2. One negative scenario
3. One boundary scenario

For each scenario, return:
- Scenario title
- Given
- When
- Then
- Risk level: LOW, MEDIUM or HIGH

Keep the answer short and objective.
Do not add explanations outside the scenarios.
`;
}