export function buildFailureAnalysisPrompt(
  failureDetails: string
): string {
  return `
You are a Senior Quality Engineer performing root cause analysis.

Analyze only the evidence provided below.

FAILURE:
${failureDetails}

Classification rules:
- TEST_AUTOMATION:
  Use when the test itself is incorrect, incomplete, misconfigured, or missing required request data such as authentication headers.
- APPLICATION_BUG:
  Use only when evidence indicates the application behavior violates the expected contract.
- ENVIRONMENT:
  Use for connection failures, host unavailable, ECONNREFUSED, DNS failures, service unavailable, infrastructure or environment connectivity issues.
- TEST_DATA:
  Use when invalid, missing, inconsistent or unavailable test data is the primary cause.
- API_DEPENDENCY:
  Use when an external API or dependent service responds incorrectly or is unavailable.
- UNKNOWN:
  Use when there is not enough evidence.

Evidence rules:
- Preserve all relevant concrete evidence from the failure.
- If there are multiple relevant facts, include all of them in the EVIDENCE line.
- For authentication failures, include status code and missing/invalid authentication evidence when present.
- For connectivity failures, include the connection error and the fact that no HTTP response was received.

Confidence rules:
- HIGH: evidence directly proves the probable cause.
- MEDIUM: evidence strongly suggests the cause but confirmation is still recommended.
- LOW: evidence is incomplete or ambiguous.
- Explicit expected/received values should normally be at least MEDIUM.
- ECONNREFUSED with no HTTP response should normally be HIGH for ENVIRONMENT unless contradictory evidence exists.

Return exactly 5 lines:

ROOT_CAUSE: <short technical cause>
CATEGORY: TEST_AUTOMATION | APPLICATION_BUG | ENVIRONMENT | TEST_DATA | API_DEPENDENCY | UNKNOWN
EVIDENCE: <all relevant concrete evidence>
ACTION: <specific and safe next action>
CONFIDENCE: LOW | MEDIUM | HIGH

Do not add extra text.
Do not invent information.
`;
}