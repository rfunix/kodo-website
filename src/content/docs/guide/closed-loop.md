---
title: "Closed-Loop Repair"
description: "How Kōdo's compiler enables autonomous error repair by AI agents"
---

# Closed-Loop Repair

Kōdo's compiler is designed for **autonomous error repair**. When an AI agent writes code that doesn't compile, the compiler returns structured, machine-parseable errors with byte-accurate fix patches that can be applied automatically — no regex parsing, no guessing, no prose interpretation.

This is the core value proposition of Kōdo: **the compiler is a repair partner, not just a validator.**

## The Repair Cycle

Every Kōdo compilation follows this closed-loop pattern:

```
    ┌──────────────────┐
    │  1. Agent writes  │
    │     .ko source    │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐       ┌──────────────────┐
    │  2. kodoc check   │──────▶│  3. kodoc fix     │
    │  --json-errors    │ erros │  (aplica patches) │
    └────────┬─────────┘       └────────┬─────────┘
             │                          │
             │ zero erros               │ retry
             │                          │
             │                 ┌────────┘
             │                 │
             │      ┌──────────▼───────┐
             │      │  2. kodoc check   │
             │      │  (re-verificar)   │
             │      └──────────┬───────┘
             │                 │
             │◀── zero erros ──┘
             │
             ▼
    ┌──────────────────┐
    │  4. kodoc build   │
    │  binary + cert    │
    └──────────────────┘
             │
             ▼
       binary nativo
    + .ko.cert.json
    + confidence scores
```

The four stages:

| Stage | Command | What happens |
|-------|---------|-------------|
| **1. Write** | *(agent generates code)* | Agent writes `.ko` source with contracts, annotations, and intent blocks |
| **2. Check** | `kodoc check --json-errors` | Compiler returns structured JSON errors with unique codes, byte offsets, and `FixPatch` objects |
| **3. Fix** | `kodoc fix` | All machine-applicable patches are applied automatically — zero guessing |
| **4. Build** | `kodoc build` | Native binary + compilation certificate with contracts verified and confidence scores persisted |

## Walkthrough: The Full Cycle

Let's walk through a complete closed-loop repair cycle, from broken code to verified binary.

### Stage 1 — Agent writes code (with a bug)

An AI agent generates the following Kōdo module. There's a deliberate type error: assigning an `Int` to a `String` variable.

```kodo
module closed_loop_demo {
    meta {
        purpose: "Demonstrate the closed-loop error repair cycle",
        version: "0.1.0",
        author: "Demo"
    }

    @authored_by(agent: "claude")
    @confidence(0.85)
    fn safe_divide(a: Int, b: Int) -> Int
        requires { b != 0 }
        ensures { result * b <= a }
    {
        return a / b
    }

    fn main() {
        let x: String = 42           // ← bug: Int assigned to String
        let result: Int = safe_divide(10, 0)  // ← will fail contract at runtime
        print_int(result)
    }
}
```

### Stage 2 — Compiler returns structured errors

```bash
kodoc check broken.ko --json-errors
```

The compiler returns **machine-parseable JSON**, not prose:

```json
{
  "errors": [
    {
      "code": "E0200",
      "severity": "error",
      "message": "type mismatch: expected `String`, found `Int`",
      "span": {
        "file": "broken.ko",
        "start": 380,
        "end": 398,
        "line": 18,
        "column": 9
      },
      "suggestion": "ensure the expression produces a value of type `String`",
      "fixability": "auto",
      "fix_patch": {
        "description": "change type to `String`",
        "start_offset": 380,
        "end_offset": 398,
        "replacement": "String"
      },
      "see_also": "docs/error_index.md#E0200"
    }
  ],
  "warnings": [],
  "status": "failed",
  "count": 1
}
```

Every field is designed for agents:

| Field | Purpose | Why it matters |
|-------|---------|----------------|
| `code` | Unique error code (`E0200`) | Agent can look up exact fix strategies per code |
| `span` | Byte offsets + line/column | Agent can locate the error precisely in the source |
| `fix_patch` | Machine-applicable replacement | Agent applies the patch with no guessing — just splice bytes |
| `fixability` | `auto`, `assisted`, or `manual` | Agent knows instantly if it can fix this alone |
| `see_also` | Link to documentation | Agent can learn more about the error pattern |

### Stage 3 — Auto-fix

The agent can preview patches before applying them:

```bash
kodoc fix broken.ko --dry-run
```

```json
{
  "applied": false,
  "patches": [
    {
      "description": "change type to `String`",
      "file": "broken.ko",
      "start_offset": 380,
      "end_offset": 398,
      "replacement": "String"
    }
  ]
}
```

Then apply all auto-fixable patches:

```bash
kodoc fix broken.ko
```

Or the agent can apply patches programmatically — the byte offsets are exact, so it's a simple string splice operation. No regex, no heuristics.

### Stage 4 — Re-check and build

After fixing `let x: String = 42` to `let x: Int = 42` and `safe_divide(10, 0)` to `safe_divide(10, 2)`:

```bash
kodoc check fixed.ko
```

```
Check passed for module `closed_loop_demo`
  contracts: 0 statically verified, 2 runtime checks
```

Zero errors. Now build:

```bash
kodoc build fixed.ko -o demo
./demo
```

```
Successfully compiled `closed_loop_demo` → demo
5
```

## Beyond the Build: Verification Artifacts

The closed-loop doesn't stop at a working binary. Kōdo generates artifacts that enable **automated trust decisions**.

### Compilation Certificate

Every build produces a `.ko.cert.json` alongside the binary:

```bash
kodoc describe ./demo
```

```
Kodo Module Metadata
========================================
  compiler_version: 0.5.1
  module: closed_loop_demo
  purpose: Demonstrate the closed-loop error repair cycle
  version: 0.1.0
  functions:
    - safe_divide (authored_by: "claude", confidence: 0.85)
        requires: [requires clause 1]
        ensures:  [ensures clause 1]
    - main
  validators:
    - validate_safe_divide
```

The certificate records: who wrote each function, what contracts are in place, and whether they were verified.

### Confidence Report

```bash
kodoc confidence-report fixed.ko
```

```
Confidence Report for module `closed_loop_demo`
============================================================
Overall confidence: 0.85
Module average:     0.85
Threshold:          0.80

Function                         Declared   Computed  Flags
----------------------------------------------------------------------
safe_divide                          0.85       0.85
main                                 1.00       0.85  no @authored_by
```

Notice: `main` has a *declared* confidence of 1.00, but its *computed* confidence drops to 0.85 because it calls `safe_divide` which has 0.85. **Confidence propagates transitively through the call graph** — a function is only as trustworthy as its least-confident dependency.

### Error Explanation

Agents can also query the compiler for detailed explanations of any error code:

```bash
kodoc explain E0200
```

```
Error E0200: Type Mismatch

An expression produced a type that does not match what was expected.
Kōdo has no implicit conversions — all types must match exactly.
For example, you cannot assign a String to an Int variable or
return a Bool from a function declared to return Int.

Example of incorrect code:
    let x: Int = "hello"    // String cannot be assigned to Int

Corrected code:
    let x: Int = 42         // Int assigned to Int — correct
```

## Structured Error Output

Every compiler error includes the following fields:

| Field | Type | Purpose |
|-------|------|---------|
| `code` | `String` | Unique error code (E0001–E0699) |
| `severity` | `String` | `"error"` or `"warning"` |
| `message` | `String` | Human-readable description |
| `span.file` | `String` | Source file path |
| `span.start` / `span.end` | `Int` | Byte offsets in source |
| `span.line` / `span.column` | `Int` | Line and column numbers |
| `suggestion` | `String` | Natural language fix suggestion |
| `fix_patch.replacement` | `String` | Exact text to splice in |
| `fix_patch.start_offset` / `end_offset` | `Int` | Byte range to replace |
| `fixability` | `String` | `"auto"`, `"assisted"`, or `"manual"` |
| `see_also` | `String` | Link to error documentation |

## Fix Categories

| Category | Meaning | Agent action |
|----------|---------|-------------|
| **`auto`** | Can be applied without human intervention | Apply `fix_patch` directly |
| **`assisted`** | Needs context from the agent | Agent uses `suggestion` + own context to fix |
| **`manual`** | Requires human decision | Flag for human review |

Target: **>80% of errors should be `auto`-fixable.** The compiler actively invests in generating precise patches, not just descriptions.

## Agent Integration Pattern

The recommended integration pattern for AI agents using Kōdo:

```
┌─────────────────────────────────────────────────────────┐
│                   Agent Workflow                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Generate .ko source code                            │
│     ↓                                                   │
│  2. kodoc check --json-errors                           │
│     ↓                                                   │
│  3. Parse JSON → categorize by fixability               │
│     ├── auto    → kodoc fix (apply patches)             │
│     ├── assisted → apply fix using agent context        │
│     └── manual  → flag for human review                 │
│     ↓                                                   │
│  4. Re-run kodoc check (verify zero errors)             │
│     ↓                                                   │
│  5. kodoc build → native binary + certificate           │
│     ↓                                                   │
│  6. kodoc confidence-report --json                      │
│     ↓                                                   │
│  7. Check: all functions > threshold?                   │
│     ├── yes → deploy                                    │
│     └── no  → flag low-confidence functions             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

This cycle typically completes in **1–2 iterations** for well-formed code. The structured error format eliminates the regex-parsing and prose-interpretation overhead that plagues agents working with traditional compilers.

## MCP Server Integration

For agents that support the Model Context Protocol, the closed-loop can be driven entirely through MCP tool calls — see [MCP Server](../mcp-server) for details:

- `kodo.check` — type-check with structured JSON errors
- `kodo.fix` — auto-apply patches
- `kodo.build` — compile to native binary
- `kodo.describe` — inspect compilation certificate
- `kodo.explain` — get error documentation
- `kodo.confidence_report` — check trust scores

## Error Code Ranges

| Range | Phase | Examples |
|-------|-------|----------|
| E0001–E0099 | Lexer | Invalid tokens, unterminated strings |
| E0100–E0199 | Parser | Syntax errors, missing braces |
| E0200–E0299 | Types | Type mismatches, undefined variables |
| E0300–E0399 | Contracts | Contract violations, Z3 refutations |
| E0400–E0499 | Resolver | Intent resolution failures |
| E0500–E0599 | MIR | Optimization issues |
| E0600–E0699 | Codegen | Code generation failures |

For the complete error catalog, see the [Error Index](/docs/reference/errors/).

## Try It Yourself

The demo files from this walkthrough are available in the repository:

- [`examples/closed_loop_demo/step1_broken.ko`](https://github.com/rfunix/kodo/blob/main/examples/closed_loop_demo/step1_broken.ko) — the broken version (with type error)
- [`examples/closed_loop_demo/step2_fixed.ko`](https://github.com/rfunix/kodo/blob/main/examples/closed_loop_demo/step2_fixed.ko) — the corrected version

Run the full cycle:

```bash
# Stage 2: Check (see structured errors)
kodoc check examples/closed_loop_demo/step1_broken.ko --json-errors

# Stage 3: Preview fixes
kodoc fix examples/closed_loop_demo/step1_broken.ko --dry-run

# Stage 4: Build the fixed version
kodoc build examples/closed_loop_demo/step2_fixed.ko -o demo
./demo

# Bonus: Inspect the result
kodoc describe ./demo
kodoc confidence-report examples/closed_loop_demo/step2_fixed.ko
kodoc explain E0200
```

## Next Steps

- [MCP Server](../mcp-server) — drive the closed-loop via MCP tool calls
- [Contracts](../contracts) — `requires` and `ensures` for compile-time and runtime verification
- [Agent Traceability](../agent-traceability) — `@authored_by`, `@confidence`, and trust propagation
- [Compilation Certificates](../compilation-certificates) — machine-readable build artifacts
- [CLI Reference](../cli-reference) — all `kodoc` commands and flags
