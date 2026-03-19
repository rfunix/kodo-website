---
title: Why Kōdo? — Comparison with Other Languages
sidebar:
  label: Why not X?
  order: 10
---

Every language makes trade-offs. This page compares Kōdo with languages that share some of its goals — and explains why AI agents need something different.

## The core question

> "Why can't an AI agent just use Rust / Dafny / Ada?"

Short answer: those languages were designed for **human programmers** solving specific problems. Kōdo is designed for **AI agents producing software that must be verifiably correct, traceable, and machine-repairable**.

---

## Kōdo vs Rust

Rust is an exceptional language for systems programming. Kōdo borrows its ownership model (`own`/`ref`/`mut`) because it works.

| Dimension | Rust | Kōdo |
|-----------|------|------|
| **Ownership** | Borrow checker, lifetimes | Linear ownership (`own`/`ref`/`mut`), no lifetimes |
| **Safety** | Memory safety | Memory safety + **contract safety** (Z3-verified `requires`/`ensures`) |
| **Error format** | Human-readable diagnostics | Structured JSON + `FixPatch` with byte offsets — agents parse and auto-apply |
| **Auto-repair** | `cargo fix` for lint-level issues | `kodoc fix` applies machine-generated patches for type errors, missing contracts, and more |
| **Authorship** | `git blame` (external) | `@authored_by`, `@confidence`, `@reviewed_by` — in the grammar, checked by the compiler |
| **Modules** | `mod` + `Cargo.toml` | Self-describing `meta {}` blocks — purpose, version, author in every module |
| **Intent** | N/A | `intent` blocks — declare what you want, resolver generates the implementation |
| **Target user** | Human systems programmers | AI agents producing verifiable software |

**When to use Rust instead**: You're a human writing a kernel, database, or embedded system. Rust's ecosystem, community, and maturity are unmatched for systems work.

**When Kōdo wins**: An AI agent needs to generate a service, verify its contracts statically, get structured error feedback, auto-fix issues in a tight loop, and produce a trust certificate — all without human intervention.

---

## Kōdo vs Dafny

Dafny pioneered accessible formal verification with pre/post-conditions. Kōdo shares its belief that contracts should be first-class citizens.

| Dimension | Dafny | Kōdo |
|-----------|-------|------|
| **Verification** | Built-in Boogie/Z3 prover | Z3 for static verification, runtime fallback for undecidable cases |
| **Compilation target** | .NET, Java, Go, Python, JavaScript | **Native binary** via Cranelift — no runtime dependency |
| **Ownership** | Garbage collected | Linear ownership — no GC, deterministic cleanup |
| **Error output** | Text diagnostics | Structured JSON with `FixPatch` — machine-applicable corrections |
| **Authorship tracking** | None | Compiler-enforced `@confidence` scores with transitive propagation |
| **Intent system** | None | Declarative `intent` blocks for code generation |
| **Ecosystem** | Academic, research-focused | Practical — HTTP server, JSON, MCP integration built into stdlib |
| **Agent integration** | Not designed for agents | Agent-first: JSON errors, fix patches, confidence certificates |

**When to use Dafny instead**: You're doing research in formal methods, need to target multiple backends, or want the most mature verification toolchain.

**When Kōdo wins**: You need verified code that compiles to a native binary, runs without a managed runtime, and integrates into an AI agent's build-test-deploy pipeline with structured feedback at every step.

---

## Kōdo vs Ada/SPARK

Ada/SPARK is the gold standard for safety-critical systems — avionics, rail, medical devices. Its contract system (`Pre`/`Post`) and SPARK subset are battle-tested.

| Dimension | Ada/SPARK | Kōdo |
|-----------|-----------|------|
| **Contracts** | `Pre`/`Post` aspects, SPARK formal proofs | `requires`/`ensures` verified by Z3, runtime fallback |
| **Safety level** | DO-178C, EN 50128 certified | Not safety-certified (designed for AI-generated software, not avionics) |
| **Syntax** | Verbose, 1980s-era | Modern, minimal — optimized for agent generation and human readability |
| **Type system** | Strong, ranged types, discriminated records | Strong, no implicit conversions, generics, traits, pattern matching |
| **Agent support** | None | `@authored_by`, `@confidence`, transitive trust, JSON error output |
| **Error repair** | Compiler errors in prose | `FixPatch` with byte offsets — agents apply fixes automatically |
| **Concurrency** | Tasks, protected objects (mature) | `spawn`/`async`/`await` (v1: sequential execution) |
| **Ecosystem** | Aerospace/defense supply chain | Modern stdlib: HTTP, JSON, testing, MCP |

**When to use Ada/SPARK instead**: You're building software where human lives depend on correctness — flight control, railway signaling, nuclear systems. Ada/SPARK has decades of certification and tooling that Kōdo doesn't attempt to replace.

**When Kōdo wins**: You need AI agents to produce, verify, and maintain software with formal-ish guarantees — but you're building web services, data pipelines, or automation, not flight controllers. Kōdo gives you contracts and verification without the ceremony.

---

## What makes Kōdo unique

No other language combines all of these:

1. **Contracts in the grammar** — `requires`/`ensures` verified by Z3, not a library or annotation processor
2. **Agent traceability** — `@authored_by`, `@confidence`, `@reviewed_by` checked by the compiler
3. **Machine-repairable errors** — every error has a JSON representation with `FixPatch` byte offsets
4. **Transitive trust** — confidence scores propagate through call chains; low-confidence code blocks compilation
5. **Intent-driven code** — declare `intent http_server`, get a working implementation
6. **Self-describing modules** — mandatory `meta {}` with purpose, version, author
7. **Native compilation** — Cranelift backend, no VM or managed runtime
8. **Closed-loop repair** — `kodoc check --json-errors` → parse → `kodoc fix` → recompile, fully automated

---

## Honest limitations

Kōdo is young. Here's what it does **not** do yet:

- **No safety certification** — not suitable for DO-178C or similar regulatory contexts
- **Concurrency is sequential in v1** — `spawn`/`async` compile but run on a single thread
- **Ecosystem is small** — no package manager, limited third-party libraries
- **Z3 verification is partial** — complex contracts may fall back to runtime checks
- **String handling is byte-based** — not fully Unicode-aware yet

We believe in being transparent about where we are. Check the [roadmap](/docs/reference/design/#development-roadmap) for what's coming next.
