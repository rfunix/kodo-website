---
title: Benchmarks — AI Agent Productivity
sidebar:
  label: Benchmarks
  order: 11
---

Traditional language benchmarks measure execution speed. For Kōdo, the question is different: **how fast can an AI agent go from "code written" to "code verified and deployed"?**

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

## kodo-bench: Quantitative Agent Evaluation

**Scenario**: Give Claude an LLM-readable language reference and 150 Kōdo coding tasks. Measure how often it produces correct code on the first try (pass@1).

### Setup

- **Model**: claude-sonnet-4-20250514
- **Runs per task**: 3 (pass@1 computed with the unbiased Codex estimator)
- **Validation**: `kodoc check` → `kodoc build` → run binary → compare stdout
- **System prompt**: [`bench/kodo-reference.md`](https://github.com/rfunix/kodo/blob/main/bench/kodo-reference.md) (~2000 tokens)

### Results by Category

| Category | pass@1 | compile_rate | Notes |
|---|---|---|---|
| ownership | **0.867** | 0.911 | own/ref/mut, borrow semantics |
| modules | **0.800** | 0.933 | pub fn/struct, meta blocks, encapsulation |
| agent-traceability | **0.800** | 0.956 | @confidence, @authored_by, @reviewed_by |
| basics | **0.800** | 0.900 | loops, structs, conditionals |
| traits-generics | 0.689 | 0.844 | trait/impl, generic functions |
| contracts-advanced | 0.667 | 0.711 | requires/ensures, refinement types |
| contracts | 0.417 | 0.958 | basic preconditions / postconditions |
| error-handling-advanced | 0.422 | 0.689 | Result chains, custom error enums |
| error-handling | 0.143 | 0.524 | Result/Option, unwrap-or |
| intents | 0.133 | 0.089 | http_server, database, cache, cli |
| concurrency | 0.083 | 0.208 | spawn / channels (sequential in v1) |
| patterns | 0.074 | 0.370 | closures, higher-order fns, string interp |
| data-structures | 0.000 | 0.375 | Set, Map edge cases |

### Aggregate

| Metric | Value |
|--------|-------|
| **pass@1 (150 tasks)** | **0.502** |
| compile_rate | 0.647 |
| easy tasks (n=44) | 0.712 |
| medium tasks (n=78) | 0.402 |
| hard tasks (n=28) | 0.452 |

### Interpretation

**What works well**: The three features that are most distinctive to Kōdo — ownership, agent traceability annotations, and contract-aware modules — are also the three categories where agents score highest. Agents pick up the Kōdo idioms for these quickly from the reference.

**What drags the score down**:
- `intents` (0.133): Intent block syntax is unfamiliar and the reference needs richer examples. compile_rate of 0.089 shows agents use wrong syntax.
- `concurrency` (0.083): `spawn`/`async`/`await` execute sequentially in v1; agents expect parallel semantics and produce wrong output.
- `patterns` (0.074): Closures, tuple destructuring, and string interpolation have Kōdo-specific syntax that differs from Python/Rust conventions.

**The verdict**: A 50.2% pass@1 on a cold start from a 2000-token reference is a strong baseline. The goal is to reach 70%+ as we improve the reference and address the known v1 limitations.

```bash
# Reproduce these results
export ANTHROPIC_API_KEY=your_key
python3 bench/agent-eval.py --model claude-sonnet-4-20250514 --runs 3
```

---

## Real-world example

We built a complete [Task Management API](https://github.com/rfunix/kodo/tree/main/examples/task_manager) in Kōdo that exercises all of these features in a single file — contracts, refinement types, agent traceability, closures, JSON serialization, HTTP server, and inline tests. The same project is also implemented in [Python, TypeScript, Rust, and Go](https://github.com/rfunix/kodo/tree/main/benchmarks) for reference.
