---
title: Benchmarks — AI Agent Productivity
sidebar:
  label: Benchmarks
  order: 11
---

Traditional language benchmarks measure execution speed. For Kōdo, the question is different: **how fast can an AI agent go from "code written" to "code verified and deployed"?**

These are qualitative benchmarks comparing agent workflows. Quantitative measurements are in development.

---

## Benchmark 1: Error→Fix Loop Speed

**Scenario**: An AI agent generates code with 10 type errors. How fast can it reach a clean compilation?

### Python + mypy

```
# Agent generates code → runs mypy
$ mypy main.py
main.py:12: error: Incompatible types in assignment
    (expression has type "str", variable has type "int")
main.py:25: error: Argument 1 to "process" has incompatible type...

# Agent must: parse prose → regex match error locations →
# guess the fix → rewrite → re-run mypy
# Some errors are ambiguous. Auto-fix rate: ~60%
```

### Kōdo

```kodo
// Agent generates code → runs kodoc check --json-errors
$ kodoc check main.ko --json-errors
```

```json
{
  "code": "E0201",
  "message": "Type mismatch: expected Int, found String",
  "span": { "file": "main.ko", "start": 142, "end": 155 },
  "fix_patch": {
    "replacement": "parse_int(value)",
    "start_byte": 142,
    "end_byte": 155,
    "confidence": "high"
  },
  "fix_difficulty": "auto"
}
```

```
# Agent applies fix_patch directly — no guessing
$ kodoc fix main.ko
Fixed 10 errors. 0 remaining.
```

| Metric | Python + mypy | Kōdo |
|--------|--------------|------|
| Error format | Prose (regex parsing needed) | Structured JSON |
| Fix mechanism | Agent guesses | `FixPatch` with byte offsets |
| Auto-fix rate | ~60% of type errors | 100% of errors with patches |
| Cycles to clean build | 2–5 | 1–2 |

---

## Benchmark 2: Correctness by Construction

**Scenario**: An AI agent generates a division function. How many bugs reach runtime?

### Python

```python
def divide(a, b):
    return a / b  # No compile-time check — ZeroDivisionError at runtime

# Agent can add a check, but nothing *enforces* it
def divide_safe(a, b):
    if b == 0:
        raise ValueError("division by zero")
    return a / b
# Still no guarantee callers handle the error
```

### Kōdo

```kodo
fn divide(a: Int, b: Int) -> Int
    requires { b != 0 }
    ensures  { result * b == a }
{
    return a / b
}

// Calling divide(10, 0) → compile-time error E0301:
// "Precondition 'b != 0' cannot be satisfied:
//  argument 'b' is literal 0"
```

| Metric | Python | Kōdo |
|--------|--------|------|
| Division by zero | Runtime exception | **Compile-time error** (Z3 proves `b != 0` is violated) |
| Contract enforcement | None (convention only) | Grammar-level `requires`/`ensures` |
| Bugs reaching runtime | Possible | **Zero** for statically verified contracts |
| Agent behavior | Hope the tests catch it | Compiler blocks the build — agent must fix |

---

## Benchmark 3: Trust Propagation

**Scenario**: A module has 5 functions. One is experimental with `@confidence(0.6)`. How fast is the risk detected?

### Python

```python
# No mechanism to track confidence or authorship
def stable_function():  # Who wrote this? How confident? No idea.
    return process(experimental_helper())

def experimental_helper():  # Agent generated this at 60% confidence
    return risky_computation()

# Risk: experimental code is silently used in production
# Detection: manual code review, maybe never
```

### Kōdo

```kodo
@authored_by(agent: "claude")
@confidence(0.95)
fn stable_function() -> Int {
    return process(experimental_helper())
    //                 ↑ E0260: Calling function with confidence 0.6
    //                   from function with confidence 0.95.
    //                   Add @reviewed_by to acknowledge the risk.
}

@authored_by(agent: "claude")
@confidence(0.6)
fn experimental_helper() -> Int {
    return risky_computation()
}
```

| Metric | Python | Kōdo |
|--------|--------|------|
| Confidence tracking | None | `@confidence` scores on every function |
| Risk propagation | Invisible | **Transitive** — min confidence propagates through call chains |
| Detection time | Manual review (hours/days/never) | **Compile-time** (instant) |
| Policy enforcement | None | Build blocked until `@reviewed_by` is added |
| Audit trail | `git blame` | Build certificates (`.ko.cert.json`) with per-function scores |

---

## The closed-loop advantage

These benchmarks share a pattern: **Kōdo moves verification left — from runtime to compile-time, from human review to automated checks.**

For an AI agent operating in a tight loop:

```
┌─────────────────────────────────────────────────┐
│  Agent writes code                              │
│       ↓                                         │
│  kodoc check --json-errors                      │
│       ↓                                         │
│  Parse JSON → apply FixPatch → recompile        │
│       ↓                                         │
│  All contracts verified by Z3                   │
│       ↓                                         │
│  Confidence scores > threshold                  │
│       ↓                                         │
│  Build certificate generated → deploy           │
└─────────────────────────────────────────────────┘
```

No human in the loop. No hoping tests catch it. No "it works on my machine."

---

## Quantitative Benchmark: Task Management API

We implemented identical Task Management APIs in five languages and measured what matters for AI agents.

### The Project

A REST API with CRUD operations, priority validation (1–5), status workflow (pending → in_progress → done), JSON serialization, file persistence, and tests. Same functionality, idiomatic code in each language.

### Token Count (GPT-4 Tokenizer)

Fewer tokens = cheaper API calls, faster generation, less context window usage.

| Metric | Kōdo | Python | TypeScript | Rust | Go |
|--------|-----:|-------:|-----------:|-----:|---:|
| **Tokens** | 5,053 | 2,230 | 4,467 | 4,819 | 4,655 |
| Code Lines | 503 | 220 | 495 | 552 | 639 |

Python is more concise in raw tokens — but those tokens buy you **zero** compile-time guarantees. The real question is: what does each token buy you?

### Safety per Token

| Language | Tokens | Bug Classes Caught | Cost per Class |
|----------|-------:|-------------------:|---------------:|
| **Kōdo** | 5,053 | **7/7** | **721** |
| Rust | 4,819 | 4/7 | 1,204 |
| TypeScript | 4,467 | 2/7 | 2,233 |
| Go | 4,655 | 2/7 | 2,327 |
| Python | 2,230 | 0/7 | ∞ |

**Kōdo delivers the most safety per token of any language in the benchmark.**

### Compile-Time Safety

| Bug Class | Kōdo | Python | TypeScript | Rust | Go |
|-----------|:----:|:------:|:----------:|:----:|:--:|
| Null/None dereference | ✅ | ❌ | ✅ | ✅ | ❌ |
| Type mismatch | ✅ | ❌ | ✅ | ✅ | ✅ |
| Contract violation | ✅ | ❌ | ❌ | ❌ | ❌ |
| Invalid status transition | ✅ | ❌ | ❌ | ❌ | ❌ |
| Value out of range | ✅ | ❌ | ❌ | ❌ | ❌ |
| Missing error handling | ✅ | ❌ | ❌ | ✅ | ✅ |
| Use after move | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Total** | **7/7** | **0/7** | **2/7** | **4/7** | **2/7** |

### Machine-Readability of Errors

| Criterion | Kōdo | Python | TypeScript | Rust | Go |
|-----------|:----:|:------:|:----------:|:----:|:--:|
| JSON parseable (+2) | +2 | — | — | — | — |
| Exact source spans (+1) | +1 | +1 | +1 | +1 | +1 |
| Suggests fix (+1) | +1 | — | — | +1 | — |
| Unique error code (+1) | +1 | — | +1 | +1 | — |
| **Total** | **5/5** | **1/5** | **2/5** | **3/5** | **1/5** |

### Agent-Unique Features

| Feature | Kōdo | Others |
|---------|:----:|:------:|
| Self-describing modules (meta) | ✅ | ❌ |
| Agent traceability annotations | ✅ | ❌ |
| Formal contract verification (Z3) | ✅ | ❌ |
| Refinement types | ✅ | ❌ |
| Intent-driven code generation | ✅ | ❌ |
| Compilation certificates | ✅ | ❌ |
| Machine-applicable fix patches | ✅ | ❌ |
| Confidence propagation | ✅ | ❌ |
| MCP server (native agent support) | ✅ | ❌ |

**9 features that no other language provides** — because no other language was designed for AI agents.

### Summary

The question isn't "which language uses the fewest tokens?" — it's **"which language lets agents produce correct code with the least total effort?"**

| Dimension | Winner | Why |
|-----------|--------|-----|
| **Safety per Token** | Kōdo | 721 tokens per bug class — best in benchmark |
| **Compile-Time Safety** | Kōdo | 7/7 bug classes caught before runtime |
| **Error Readability** | Kōdo | 5/5 — structured JSON with auto-fix patches |
| **Agent Features** | Kōdo | 9/9 — purpose-built for AI agents |

Full source code: [github.com/rfunix/kodo/benchmarks](https://github.com/rfunix/kodo/tree/main/benchmarks) and [examples/task_manager](https://github.com/rfunix/kodo/tree/main/examples/task_manager).
