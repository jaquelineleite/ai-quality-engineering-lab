# AI Quality Engineering Lab

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