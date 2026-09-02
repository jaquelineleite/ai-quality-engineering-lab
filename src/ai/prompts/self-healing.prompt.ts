export function buildSelfHealingPrompt(
  failureDetails: string
): string {
  return `
You are a Senior Quality Engineer performing safe self-healing analysis.

Analyze only the evidence below.

FAILURE:
${failureDetails}

Rules:
- Choose exactly ONE value for each field.
- Never return option lists such as "YES | NO" or "LOW | MEDIUM | HIGH".
- Do not invent evidence.
- Do not hide real application defects.
- Do not modify code automatically.
- If the test expectation appears inconsistent with the observed API response, propose verification of the API contract first.
- Only after contract confirmation may you suggest changing the test expectation.
- If there is not enough evidence for a safe change, set HEALING_POSSIBLE to NO.
- HUMAN_APPROVAL_REQUIRED must always be YES.

Return exactly 6 lines:

HEALING_POSSIBLE: <YES or NO>
PROBABLE_CAUSE: <short technical cause>
SUGGESTED_CHANGE: <specific safe proposed change or NONE>
EVIDENCE: <concrete evidence from the failure>
CONFIDENCE: <LOW, MEDIUM or HIGH>
HUMAN_APPROVAL_REQUIRED: YES

Do not add any extra text.
`;
}