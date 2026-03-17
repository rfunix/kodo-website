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

## Quantitative benchmarks: coming soon

We're developing reproducible benchmarks measuring:

- **Cycles to clean compilation** — agent attempts until zero errors
- **Time to first successful build** — wall clock from code generation to binary
- **Contract coverage** — percentage of functions with verified pre/post-conditions
- **Fix patch hit rate** — percentage of errors with machine-applicable patches

Results will be published here as they become available. Want to contribute? [Open an issue on GitHub](https://github.com/rfunix/kodo/issues).
