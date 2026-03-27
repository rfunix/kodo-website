---
title: "Why Kōdo?"
sidebar:
  order: 0
---

# Why Kōdo?

AI agents write code. But how do you trust it?

## The Problem

SWE-bench 2026 reveals a stark gap: agents score **78% on curated benchmarks** but only **23% on real-world tasks**. The difference? Real code has ambiguity, implicit assumptions, and no guardrails.

Current languages weren't designed for AI agents:
- **Python**: No types at runtime, errors at deploy time, no formal contracts
- **Go**: Simple but no ownership model, no contract verification
- **Rust**: Powerful but complex borrow checker, steep learning curve for agents

## The Solution

Kōdo is the first programming language **designed from the ground up for AI agents** — while remaining fully transparent and auditable by humans.

### Contracts verified by Z3

Every function can declare what must be true before and after it runs:

```rust
fn transfer(amount: Int, balance: Int) -> Int
    requires { amount > 0 }
    requires { amount <= balance }
    ensures { result >= 0 }
{
    return balance - amount
}
```

The Z3 SMT solver **proves these at compile time** — not just checks at runtime. An agent writing Kōdo can't ship code that violates its contracts.

### Authorship tracking built into the compiler

Every function tracks who wrote it and how confident they are:

```rust
@authored_by(agent: "claude", model: "sonnet-4")
@confidence(0.95)
fn process_payment(amount: Int) -> String
    requires { amount > 0 }
{
    return "approved"
}
```

The compiler enforces: low-confidence code must be reviewed before deployment. `kodoc audit --policy "min_confidence=0.9"` gates your CI pipeline.

### Structured errors that agents can parse

Every compiler error is machine-readable JSON with fix patches:

```bash
$ kodoc check broken.ko --json-errors
{
  "errors": [{
    "code": "E0200",
    "message": "type mismatch: expected Int, got String",
    "fix_patch": {
      "description": "change return type to String",
      "start": 42, "end": 45,
      "replacement": "String"
    }
  }]
}
```

Agents don't guess fixes — they apply patches. This closes the error→fix→recompile loop in one step.

### Contract inference with `kodoc annotate`

Don't write contracts manually — let the compiler suggest them:

```bash
$ kodoc annotate payment.ko
payment.ko:5: fn process_payment()
  + requires { amount > 0 }    [verified: body checks `amount > 0`]
  + requires { divisor != 0 }  [verified: parameter used as divisor]

2 contracts suggested, 2 verified.
```

## What makes Kōdo different

| Feature | Kōdo | Rust | Python | Go |
|---------|------|------|--------|-----|
| Contracts (requires/ensures) | ✅ Z3 | ❌ | ❌ | ❌ |
| Ownership (no GC) | ✅ own/ref/mut | ✅ | ❌ | ❌ |
| Agent traceability | ✅ @authored_by | ❌ | ❌ | ❌ |
| Machine-readable errors | ✅ JSON + patches | Partial | ❌ | Partial |
| Contract inference | ✅ kodoc annotate | ❌ | ❌ | ❌ |
| SARIF diagnostics | ✅ | ❌ | ❌ | ❌ |

## Who is Kōdo for?

- **AI agent developers** who need trustworthy code generation
- **Teams using AI coding assistants** who want audit trails
- **Security-sensitive applications** where contracts prevent bugs by construction
- **Anyone building software** where correctness matters more than speed of writing

## Get Started

```bash
# Install
cargo install kodoc

# Write your first program
kodoc init my-project
kodoc build src/main.ko
./my-project

# Let the compiler suggest contracts
kodoc annotate src/main.ko
```

[Get Started →](/docs/getting-started/)
