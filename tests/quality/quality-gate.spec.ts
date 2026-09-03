import { expect, test } from "@playwright/test";
import { evaluateQualityGate } from "../../src/quality/quality-gate.js";

test.describe("Quality Gate", () => {
  test("should return PASSED when all quality criteria are satisfied", () => {
    const result = evaluateQualityGate({
      total: 2,
      passed: 2,
      failed: 0,
      skipped: 0,
      flaky: 0,
    });

    expect(result.status).toBe("PASSED");
    expect(result.passRate).toBe(100);
  });

  test("should return FAILED when tests fail and pass rate is below policy", () => {
    const result = evaluateQualityGate({
      total: 2,
      passed: 1,
      failed: 1,
      skipped: 0,
      flaky: 0,
    });

    expect(result.status).toBe("FAILED");
    expect(result.passRate).toBe(50);
  });

  test("should return WARNING when flaky tests exceed the policy", () => {
    const result = evaluateQualityGate({
      total: 21,
      passed: 20,
      failed: 0,
      skipped: 0,
      flaky: 1,
    });

    expect(result.status).toBe("WARNING");
    expect(result.passRate).toBe(100);
  });

  test("should return ERROR when no tests are discovered", () => {
    const result = evaluateQualityGate({
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      flaky: 0,
    });

    expect(result.status).toBe("ERROR");
    expect(result.executedTests).toBe(0);
  });
});
