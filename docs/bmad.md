# Use the documentation with BMAD

The local configuration sets `modules.bmm.project_knowledge` to `{project-root}/docs`. Start with [index.md](index.md), then read the guide relevant to your task.

## Choose a workflow

Invoke a skill by name. The installed help catalog routes these intents:

| Intent | Skill | Input |
| --- | --- | --- |
| Decide the next step | `bmad-help` | Project docs and existing artifacts |
| Create or update requirements | `bmad-prd` | Current behavior and product goals; root `PRD.md` is only a redesign task list |
| Record architecture decisions | `bmad-architecture` | [Implementation map](architecture.md), requirements, and deployment gaps |
| Break requirements into work | `bmad-create-epics-and-stories` | Agreed requirements and architecture decisions |
| Implement work | `bmad-build` | A concrete spec or story and acceptance criteria |
| Set up agent instructions | `bmad-project-context` | Repository evidence and maintainer rules |

The current project-context skill replaces retired `document-project` and `generate-project-context` workflows. It writes a managed `AGENTS.md` block rather than a general application manual. This documentation addition does not create or modify agent instructions.

## Artifact locations

Local BMAD configuration assigns:

- `docs/` to project knowledge.
- `_bmad-output/planning-artifacts/` to planning outputs.
- `_bmad-output/implementation-artifacts/` to implementation outputs.
- `_bmad-output/test-artifacts/` to test artifacts.

No artifact files were found in `_bmad-output` during inspection. Root background documents do not prove that BMAD planning is complete.

## Maintain the documentation

Update the relevant guide when changes alter setup, variables, storage, or routes. Verify command claims against `package.json`, configuration claims against the consuming module, and database claims against the schema and active service.

Regenerate the API inventory after changing exported route handlers:

```sh
python3 docs/tools/generate-api-docs.py
```

[The generator](tools/generate-api-docs.py) lists paths and exported methods. It does not derive authentication, request schemas, response schemas, or security guarantees.
