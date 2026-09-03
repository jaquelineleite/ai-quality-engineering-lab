export type QualityGateStatus =
  | "PASSED"
  | "WARNING"
  | "FAILED"
  | "ERROR";

export interface QualityMetrics {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
}

export interface QualityGatePolicy {
  minPassRate: number;
  maxFailedTests: number;
  maxFlakyTests: number;
}

export interface QualityGateResult {
  status: QualityGateStatus;
  passRate: number;
  executedTests: number;
  reasons: string[];
  policy: QualityGatePolicy;
}

export const DEFAULT_QUALITY_POLICY: QualityGatePolicy = {
  minPassRate: 95,
  maxFailedTests: 0,
  maxFlakyTests: 0,
};

export function evaluateQualityGate(
  metrics: QualityMetrics,
  policy: QualityGatePolicy = DEFAULT_QUALITY_POLICY
): QualityGateResult {
  const reasons: string[] = [];

  if (metrics.total <= 0) {
    return {
      status: "ERROR",
      passRate: 0,
      executedTests: 0,
      reasons: ["No tests were discovered or executed."],
      policy,
    };
  }

  const executedTests =
    metrics.passed +
    metrics.failed +
    metrics.flaky;

  if (executedTests <= 0) {
    return {
      status: "ERROR",
      passRate: 0,
      executedTests: 0,
      reasons: [
        "The suite contains tests, but no executable test produced a result.",
      ],
      policy,
    };
  }

  const passRate = Number(
    (((metrics.passed + metrics.flaky) / executedTests) * 100).toFixed(2)
  );

  if (metrics.failed > policy.maxFailedTests) {
    reasons.push(
      `Failed tests (${metrics.failed}) exceeded the allowed maximum (${policy.maxFailedTests}).`
    );
  }

  if (passRate < policy.minPassRate) {
    reasons.push(
      `Pass rate (${passRate}%) is below the minimum required (${policy.minPassRate}%).`
    );
  }

  if (
    metrics.failed > policy.maxFailedTests ||
    passRate < policy.minPassRate
  ) {
    return {
      status: "FAILED",
      passRate,
      executedTests,
      reasons,
      policy,
    };
  }

  if (metrics.flaky > policy.maxFlakyTests) {
    reasons.push(
      `Flaky tests (${metrics.flaky}) exceeded the allowed maximum (${policy.maxFlakyTests}).`
    );

    return {
      status: "WARNING",
      passRate,
      executedTests,
      reasons,
      policy,
    };
  }

  reasons.push("All quality gate criteria were satisfied.");

  return {
    status: "PASSED",
    passRate,
    executedTests,
    reasons,
    policy,
  };
}