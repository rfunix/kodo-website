---
title: Benchmarks — AI Agent Productivity
description: Transparent methodology and results comparing Kōdo, Python, TypeScript, Rust, and Go for AI agent workflows
sidebar:
  label: Benchmarks
  order: 11
---

## What this benchmark is — and what it isn't

Traditional language benchmarks measure execution speed: sorting arrays, parsing JSON, serving HTTP requests. **This is not that kind of benchmark.**

Kōdo was designed for a specific use case: AI agents writing, verifying, and maintaining code. The questions we care about are different:

- How many categories of bugs does the compiler catch before the code runs?
- How easily can an agent parse errors and fix them autonomously?
- What built-in language features exist specifically for agent workflows?

**What this benchmark does NOT measure:**

- Runtime performance (Kōdo compiles to native code via Cranelift, but we haven't benchmarked throughput or latency against other languages — that's a separate effort)
- Ecosystem maturity (Python, TypeScript, Rust, and Go have vast ecosystems built over years/decades; Kōdo is new)
- Developer ergonomics for humans (Kōdo is designed for agents, not for human typing speed)
- Real-world production readiness (Kōdo is v1.0 — the other languages here power billions of production systems)

We believe in transparent benchmarks. Every number below is reproducible from open source code, and we explain exactly what we measured and why.

---

## The project

We implemented the **same** Task Management REST API in five languages:

- **Kōdo** — single file using all language features
- **Python** — FastAPI + Pydantic
- **TypeScript** — Express + Zod
- **Rust** — Axum + serde
- **Go** — net/http + encoding/json

Every implementation has the same functionality:

- CRUD operations on tasks (create, list, get, update, delete)
- Priority validation: must be between 1 and 5
- Status workflow: `pending` → `in_progress` → `done` (no skipping, no going back)
- JSON serialization and REST endpoints
- File-based persistence
- Test suite covering the same scenarios

All implementations are idiomatic for their language. We didn't artificially inflate boilerplate or strip comments to skew results. **All source code is public**: [github.com/rfunix/kodo/benchmarks](https://github.com/rfunix/kodo/tree/main/benchmarks) and [examples/task_manager](https://github.com/rfunix/kodo/tree/main/examples/task_manager).

---

## Methodology

### Token count

We use [tiktoken](https://github.com/openai/tiktoken) with the `cl100k_base` encoding (GPT-4 tokenizer) to count tokens for all source files in each implementation. This measures how much context window an AI agent needs to read or generate the project.

**Important caveat:** Token count alone doesn't tell you which language is "better." Python is famously concise — fewer tokens is expected. The question is what guarantees those tokens provide.

### Lines of code

Total lines, non-empty code lines (excluding comments and blank lines), and comment lines. Counted with a simple script — no weighting, no manual classification.

### Compile-time safety

We selected 7 categories of bugs that commonly appear in CRUD applications and checked whether each language's compiler/type checker catches them **before the code runs**:

| Bug Category | What it means | How we checked |
|---|---|---|
| **Null/None dereference** | Accessing a value that might not exist | Does the type system distinguish nullable from non-nullable? |
| **Type mismatch** | Passing a String where an Int is expected | Does the compiler reject type errors? |
| **Contract violation** | Calling `divide(x, 0)` when the function requires `b != 0` | Does the language support compile-time precondition checking? |
| **Invalid state transition** | Going from "pending" directly to "done" | Can the compiler enforce business rules about valid transitions? |
| **Value out of range** | Setting priority to 0 or 99 | Can the type system constrain value ranges at compile time? |
| **Missing error handling** | Ignoring a function that returns an error | Does the compiler force you to handle errors? |
| **Use after move** | Using a value after it's been transferred to another owner | Does the compiler track ownership and prevent use-after-move? |

**Scoring:** A language gets ✅ for a category if the **compiler itself** (not a linter, not a test, not a runtime check) rejects the bug. Partial credit is noted where relevant.

**Honest notes on specific scores:**

- **TypeScript gets ✅ for null safety** because `strictNullChecks` is standard practice, though it's opt-in. We count it because virtually all modern TS projects enable it.
- **Go gets ✅ for type mismatch** but ❌ for missing error handling, even though Go convention is to check `err`. The compiler doesn't *force* you to — you can silently ignore return values.
- **Kōdo gets ✅ for contract violation, state transitions, and value ranges** because `requires`/`ensures` and refinement types are language primitives verified by the compiler (via Z3 SMT solver or runtime checks). No other language in this benchmark has an equivalent built-in feature.
- **Python gets 0/7** because Python has no compiler in the traditional sense. Tools like mypy, Pydantic, and pytest catch many of these bugs — but they're runtime or external tools, not the language's compiler. If we measured "tools available in the ecosystem," Python would score much higher.

### Machine-readability of errors

When an AI agent writes code and it doesn't compile, the agent needs to understand what went wrong and fix it. We scored error output on 4 criteria:

| Criterion | Points | What we checked |
|---|---|---|
| **JSON parseable** | +2 | Can you get errors as structured JSON (not prose)? |
| **Exact source spans** | +1 | Do errors include file, line, column, and byte offsets? |
| **Suggests fix** | +1 | Does the error message suggest what to change? |
| **Unique error code** | +1 | Does each error type have a unique code (e.g., E0200)? |

JSON gets +2 (double weight) because it's the difference between an agent regex-parsing human-readable error messages vs. doing a `json.loads()`. This is a significant engineering advantage for autonomous repair loops.

**Why Rust scores 3/5 and not higher:** Rust's error messages are excellent — among the best in any language. They have spans, suggestions, and error codes. However, `rustc --error-format=json` produces a non-standard JSON format that requires custom parsing. Kōdo's `--json-errors` outputs a simpler structure designed specifically for agent consumption, with `FixPatch` objects that include byte offsets for automatic replacement.

### Agent-unique features

These are language features that exist specifically for AI agent workflows. We checked whether each feature is a **built-in language primitive** (not a library, convention, or external tool):

| Feature | What it means |
|---|---|
| **Self-describing modules** | Module metadata (purpose, version, author) is part of the grammar |
| **Agent traceability** | `@authored_by`, `@confidence`, `@reviewed_by` are compiler-checked annotations |
| **Contract verification** | `requires`/`ensures` verified by Z3 SMT solver at compile time |
| **Refinement types** | `type Priority = Int requires { self >= 1 && self <= 5 }` |
| **Intent-driven codegen** | `intent` blocks that expand to verified implementations |
| **Compilation certificates** | `.ko.cert.json` with per-function verification status |
| **Fix patches** | Compiler outputs machine-applicable patches with byte offsets |
| **Confidence propagation** | Transitive confidence scores through the call graph |
| **MCP server** | Native Model Context Protocol server for agent integration |

**This is an inherently unfair comparison** — and we acknowledge that. These features don't exist in other languages because other languages weren't designed for this use case. This isn't a criticism of Python, Rust, Go, or TypeScript. It's the reason Kōdo exists.

---

## Results

### Token count (GPT-4 tokenizer)

| Language | Files | Tokens | Code Lines |
|----------|------:|-------:|-----------:|
| Kōdo | 1 | 5,053 | 503 |
| Python | 7 | 2,230 | 220 |
| TypeScript | 6 | 4,467 | 495 |
| Rust | 6 | 4,819 | 552 |
| Go | 6 | 4,655 | 639 |

**Python wins on raw token count.** This is expected — Python is one of the most concise general-purpose languages, and FastAPI's decorator-based routing produces minimal boilerplate. We don't claim Kōdo is more concise than Python.

**What Kōdo's extra tokens buy you:** The Kōdo implementation includes contracts (`requires`/`ensures`), refinement types, agent traceability annotations (`@authored_by`, `@confidence`, `@reviewed_by`), and inline tests — all of which are absent from the Python version because Python doesn't have these features. Those ~2,800 extra tokens compared to Python provide 7 categories of compile-time bug prevention that Python provides zero of.

### Compile-time safety

| Bug Class | Kōdo | Python | TypeScript | Rust | Go |
|-----------|:----:|:------:|:----------:|:----:|:--:|
| Null/None dereference | ✅ | ❌ | ✅ | ✅ | ❌ |
| Type mismatch | ✅ | ❌ | ✅ | ✅ | ✅ |
| Contract violation | ✅ | ❌ | ❌ | ❌ | ❌ |
| Invalid state transition | ✅ | ❌ | ❌ | ❌ | ❌ |
| Value out of range | ✅ | ❌ | ❌ | ❌ | ❌ |
| Missing error handling | ✅ | ❌ | ❌ | ✅ | ✅ |
| Use after move | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Total** | **7/7** | **0/7** | **2/7** | **4/7** | **2/7** |

**The gap between Kōdo (7/7) and Rust (4/7) is contracts.** Rust's type system is powerful — it catches null dereferences, type errors, unhandled errors, and use-after-move. But Rust has no built-in way to say "this function requires `priority >= 1 && priority <= 5`" or "this state machine only allows these transitions" and have the compiler enforce it. That's what Kōdo's `requires`/`ensures` and refinement types add.

### Machine-readability of errors

| Criterion | Kōdo | Python | TypeScript | Rust | Go |
|-----------|:----:|:------:|:----------:|:----:|:--:|
| JSON parseable (+2) | +2 | — | — | — | — |
| Exact source spans (+1) | +1 | +1 | +1 | +1 | +1 |
| Suggests fix (+1) | +1 | — | — | +1 | — |
| Unique error code (+1) | +1 | — | +1 | +1 | — |
| **Total** | **5/5** | **1/5** | **2/5** | **3/5** | **1/5** |

### Agent-unique features

| Feature | Kōdo | Python | TypeScript | Rust | Go |
|---------|:----:|:------:|:----------:|:----:|:--:|
| Self-describing modules | ✅ | ❌ | ❌ | ❌ | ❌ |
| Agent traceability | ✅ | ❌ | ❌ | ❌ | ❌ |
| Contract verification (Z3) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Refinement types | ✅ | ❌ | ❌ | ❌ | ❌ |
| Intent-driven codegen | ✅ | ❌ | ❌ | ❌ | ❌ |
| Compilation certificates | ✅ | ❌ | ❌ | ❌ | ❌ |
| Machine-applicable fix patches | ✅ | ❌ | ❌ | ❌ | ❌ |
| Confidence propagation | ✅ | ❌ | ❌ | ❌ | ❌ |
| MCP server (native) | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Total** | **9/9** | **0/9** | **0/9** | **0/9** | **0/9** |

---

## What we're NOT claiming

To be completely clear:

1. **We're not claiming Kōdo is "better than Python/Rust/Go/TypeScript"** in any absolute sense. Those are mature, battle-tested languages with massive ecosystems. Kōdo is a v1.0 language with a specific focus.

2. **We're not claiming token count determines language quality.** Python being more concise is a feature, not a flaw. We show token counts for transparency, not as a ranking.

3. **We're not claiming Kōdo is production-ready for all use cases.** It's designed for a specific niche: AI agents writing verified, traceable code. It doesn't replace general-purpose languages.

4. **We're not claiming the "safety per token" metric is an industry standard.** It's a derived metric we created to express the relationship between code size and compile-time guarantees. We present it because it answers a question relevant to AI agents: "for every token I spend, how much safety do I get?" — but we acknowledge it's our metric, not an established one.

5. **We're not claiming 100% of bugs are caught at compile time.** Contracts and refinement types catch specific categories of bugs. Logic errors, performance bugs, and integration issues still require testing.

## What we ARE claiming

Kōdo was designed from scratch for AI agents, and this benchmark demonstrates the concrete result of that design:

1. **Contracts and refinement types catch bugs that no other language in this benchmark can catch at compile time.** Specifically: business rule violations (invalid state transitions, out-of-range values) and precondition violations (division by zero, empty string inputs).

2. **Structured JSON errors with fix patches enable tighter autonomous repair loops.** An agent working with Kōdo can parse an error, apply a fix, and recompile without guessing. This is a measurable engineering advantage.

3. **Agent-specific language features (traceability, confidence, certificates) provide infrastructure that doesn't exist elsewhere.** You can build similar tooling on top of other languages with libraries and conventions — but the compiler won't enforce them.

---

## Reproduce it yourself

All code is open source:

```bash
git clone https://github.com/rfunix/kodo.git
cd kodo

# Run the measurement script
pip install tiktoken
python benchmarks/measure.py

# Verify the Kōdo implementation
kodoc check examples/task_manager/task_manager.ko
kodoc build examples/task_manager/task_manager.ko

# Run tests in each language
cd benchmarks/python && pip install -r requirements.txt && pytest task_manager/tests.py
cd benchmarks/go && go test ./...
cd benchmarks/rust && cargo test
cd benchmarks/typescript && npm install && npx vitest run
```

Found an error? Think a score is unfair? [Open an issue](https://github.com/rfunix/kodo/issues) — we want this benchmark to be trustworthy.
