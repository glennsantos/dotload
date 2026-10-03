# dotload documentation

This folder documents the existing application for developers and BMAD agents. It is the `modules.bmm.project_knowledge` path in the local BMAD configuration. Repository files provide the evidence for implementation claims. Live hosting settings and provider behavior have not been verified.

Checked against the working tree based on commit `ef07d41` on 2026-10-04. Read the linked source when changing behavior.

| Task | Guide |
| --- | --- |
| Set up a development environment | [Run locally](development.md) |
| Look up a variable and its consumer | [Configuration reference](configuration.md) |
| Understand database, authentication, and storage boundaries | [Application architecture](architecture.md) |
| Locate an endpoint and its exported methods | [API route inventory](api.md) |
| Check a build or prepare a deployment | [Deployment and verification](operations.md) |
| Start BMAD work | [BMAD documentation workflow](bmad.md) |

## Existing documents

The root [architecture document](../ARCHITECTURE.md), [data flows](../DATA_FLOWS.md), and [process flows](../PROCESS_FLOWS.md) provide background. Use the current code when those documents disagree with the implementation. The root [PRD](../PRD.md) is a frontend redesign task list, and the [launch checklist](../LAUNCH_CHECKLIST.md) is a planning artifact, not deployment evidence.

The [test README](../tests/README.md) and [test plan](../tests/TEST_PLAN.md) provide additional context. Current runner settings come from [jest.config.js](../jest.config.js) and [package.json](../package.json).
