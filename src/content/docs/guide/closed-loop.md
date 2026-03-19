---
title: "Closed-Loop Repair"
description: "How Kōdo's compiler enables autonomous error repair by AI agents"
---

# Closed-Loop Repair

Kōdo's compiler is designed for **autonomous error repair**. When an AI agent writes code that doesn't compile, the compiler returns structured, machine-parseable errors with byte-accurate fix patches that can be applied automatically.

## The Repair Cycle

```
Agent writes .ko → kodoc check --json-errors → structured errors → kodoc fix → build succeeds
```

1. **Agent writes code** — Kōdo source with contracts, annotations, and intent blocks
2. **Compiler checks** — `kodoc check --json-errors` returns structured JSON errors
3. **Auto-fix** — `kodoc fix` applies all machine-applicable patches automatically
4. **Build succeeds** — Native binary + compilation certificate

## Structured Error Output

Every compiler error includes:

```json
{
  "code": "E0201",
  "message": "undefined type `conter`",
  "severity": "error",
  "span": {
    "file": "main.ko",
    "start_line": 5,
    "start_col": 12,
    "end_line": 5,
    "end_col": 18
  },
  "suggestion": "did you mean `counter`?",
  "fix_patch": {
    "description": "rename to closest match",
    "start_offset": 42,
    "end_offset": 48,
    "replacement": "counter"
  },
  "fix_category": "auto"
}
```

### Error Fields

| Field | Purpose |
|-------|---------|
| `code` | Unique error code (E0001–E0699) |
| `message` | Human-readable description |
| `span` | File, line, column, and byte offsets |
| `suggestion` | Natural language fix suggestion |
| `fix_patch` | Machine-applicable patch with byte offsets |
| `fix_category` | `auto`, `assisted`, or `manual` |

## Fix Categories

- **`auto`** — Can be applied without human intervention (typo corrections, missing imports, type annotations)
- **`assisted`** — Needs context from the agent (ambiguous type resolution, multiple possible fixes)
- **`manual`** — Requires human decision (architectural changes, contract design)

## Using kodoc fix

```bash
# Check and get structured errors
kodoc check main.ko --json-errors > errors.json

# Apply all auto-fixable patches
kodoc fix main.ko

# Apply patches for specific error codes
kodoc fix main.ko --only E0201,E0203
```

## Agent Integration

The closed-loop cycle is designed for AI agents to operate autonomously:

1. Agent generates Kōdo code
2. Agent runs `kodoc check --json-errors`
3. Agent parses JSON response (no regex needed)
4. Agent runs `kodoc fix` for auto-fixable errors
5. Agent handles `assisted` errors with context
6. Agent flags `manual` errors for human review
7. Agent re-runs `kodoc check` to verify

This cycle typically completes in 1-2 iterations for well-formed code.

## Error Code Ranges

| Range | Phase |
|-------|-------|
| E0001–E0099 | Lexer |
| E0100–E0199 | Parser |
| E0200–E0299 | Types |
| E0300–E0399 | Contracts |
| E0400–E0499 | Resolver |
| E0500–E0599 | MIR |
| E0600–E0699 | Codegen |

For the complete error catalog, see the [Error Index](/docs/reference/errors/).
