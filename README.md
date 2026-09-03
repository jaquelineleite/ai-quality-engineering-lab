# AI Quality Engineering Lab
[![Quality Engineering CI](https://github.com/jaquelineleite/ai-quality-engineering-lab/actions/workflows/quality.yml/badge.svg)](https://github.com/jaquelineleite/ai-quality-engineering-lab/actions/workflows/quality.yml)


AI-Native Quality Engineering project focused on combining automated testing, Model Context Protocol (MCP), local LLMs, Open Banking APIs, intelligent failure analysis and LLM evaluation.

The project demonstrates how AI can support Quality Engineering without replacing traditional quality controls, using measurable quality gates, human approval for self-healing suggestions and automated test execution.

---

## Project Goals

This lab explores an AI-Native QA architecture capable of:

- Executing automated API tests through MCP tools
- Generating BDD/Gherkin test scenarios using an LLM
- Analyzing automated test failures with AI
- Performing safe self-healing analysis
- Evaluating LLM responses using a Golden Dataset
- Applying Quality Gates to traditional tests and AI outputs
- Testing APIs in a financial/Open Banking context
- Running automated quality checks through CI/CD

---

## Architecture

```text
                    ┌──────────────────────┐
                    │     MCP Client       │
                    │ MCP Inspector / Agent│
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      MCP Server      │
                    │     TypeScript       │
                    └──────────┬───────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
     │  Playwright  │  │ Ollama / LLM │  │ Quality Data │
     │  API Testing │  │ Qwen 2.5 7B  │  │ JSON Reports │
     └──────┬───────┘  └──────┬───────┘  └──────────────┘
            │                 │
            ▼                 ▼
     ┌──────────────┐  ┌──────────────────────┐
     │ ServeRest API│  │ AI Quality Functions │
     │ Open Banking │  │ Scenario Generation  │
     │ Sandbox      │  │ Failure Analysis     │
     └──────────────┘  │ Self-Healing Analysis│
                       └──────────┬───────────┘
                                  │
                                  ▼
                       ┌──────────────────────┐
                       │    Golden Dataset    │
                       │   LLM Evaluation     │
                       │    Quality Gate      │
                       └──────────────────────┘
```
---

## MCP Tools

The MCP server currently exposes six Quality Engineering tools.

### `get_quality_status`

Reads the latest Playwright JSON report and returns real quality metrics such as total tests, passed tests, failed tests, pass rate and Quality Gate status.

### `run_api_tests`

Triggers the Playwright API test suite through MCP and returns the execution results and quality metrics.

### `generate_test_scenarios`

Uses a local LLM to generate concise risk-based BDD/Gherkin scenarios from software requirements.

### `analyze_test_failure`

Uses AI to perform Root Cause Analysis on test failures based on the available evidence.

Supported classifications include: TEST_AUTOMATION, APPLICATION_BUG, ENVIRONMENT, TEST_DATA, API_DEPENDENCY and UNKNOWN.

### `self_healing_analysis`

Analyzes whether a failed automated test has a safe remediation candidate.

The tool does not automatically modify source code and requires human approval before any proposed change.

### `evaluate_quality_gate`

Evaluates automated test metrics against a Quality Engineering policy.

Example result: 100% pass rate, 0 failed tests, 0 flaky tests and Quality Gate PASSED.

This allows MCP-compatible agents and clients to evaluate pass rate, failures and flaky tests consistently.

---

## Automated Test Coverage

The CI/CD pipeline currently executes 6 automated Playwright tests across 3 projects:

- ServeRest API validation
- Open Banking API validation
- Quality Gate PASSED behavior
- Quality Gate FAILED behavior
- Quality Gate WARNING behavior
- Quality Gate ERROR behavior

Current CI result: **6 passed**.

---

## Quick Start

Clone the repository, install the dependencies and run the automated quality checks locally.

### 1. Install

```bash
git clone https://github.com/jaquelineleite/ai-quality-engineering-lab.git
cd ai-quality-engineering-lab
npm install
```

### 2. Run Automated Tests

```bash
npm run test:api
```

Expected result:

```text
6 passed
```

### 3. Build the Project

```bash
npm run build
```

### 4. Run the Complete Local Quality Check

```bash
npm run quality:check
```

This command runs the automated API tests and the LLM evaluation pipeline.
