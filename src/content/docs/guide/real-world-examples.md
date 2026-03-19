---
title: "Real-World Examples"
sidebar:
  order: 21
---

These examples demonstrate complete programs that showcase **what makes Kōdo different from every other language**: compiler-enforced trust policies, contract verification, ownership safety, and agent traceability. Each example shows features that only exist in Kōdo.

## Why These Examples Matter

In other languages, an AI agent generates code and hopes it's correct. In Kōdo:

- **The compiler tracks who wrote each function** (`@authored_by`, `@confidence`)
- **Low-confidence code won't compile without human review** (`@reviewed_by`)
- **Security-sensitive code must have contracts** (`@security_sensitive`)
- **Contracts are verified by Z3 at compile time** — not just type-checked
- **Ownership prevents use-after-move bugs** that agents commonly introduce
- **Every module is self-describing** — agents can understand modules without reading implementation

Run `kodoc confidence-report <file>` on any example to see the full trust audit.

---

## Todo App — Agent Traceability

An AI agent builds a task manager. The compiler enforces quality guarantees on every function the agent writes.

**Kōdo-unique features:** `@authored_by`, `@confidence`, `@reviewed_by` (compiler-enforced review), contracts (`requires`), `ref` borrowing

```rust
// High confidence: agent is sure this is correct.
@authored_by(agent: "claude")
@confidence(0.99)
fn create_task(id: Int, title: String, priority: String) -> Task
    requires { id > 0 }
{
    return Task { id: id, title: title, done: false, priority: priority }
}

// 0.7 < 0.8 → compiler REQUIRES @reviewed_by or won't compile.
@authored_by(agent: "claude")
@confidence(0.7)
@reviewed_by(human: "rafael")
fn count_completed(flags: List<Int>) -> Int {
    return flags.fold(0, |acc: Int, x: Int| -> Int { acc + x })
}
```

```bash
kodoc build examples/todo_app.ko -o todo_app && ./todo_app
kodoc confidence-report examples/todo_app.ko
```

Source: [`examples/todo_app.ko`](https://github.com/rfunix/kodo/blob/main/examples/todo_app.ko)

---

## URL Shortener — Security Contracts + Refinement Types

Every URL validation function is `@security_sensitive` — the compiler **refuses to compile** it without a contract. Refinement types make invalid values impossible to construct.

**Kōdo-unique features:** `@security_sensitive` (E0262 without contracts), refinement types (`type ShortCode = Int requires { ... }`), contract chains, `@authored_by`

```rust
// Refinement type: codes must be positive
type ShortCode = Int requires { self > 0 }

// @security_sensitive → compiler rejects this without a contract (E0262).
@security_sensitive
@authored_by(agent: "claude")
@confidence(0.95)
fn is_valid_url(url: String) -> Bool
    requires { url.length() > 0 }
{
    return url.starts_with("http://") || url.starts_with("https://")
}

// Contract chain: every function that touches codes requires code > 0.
// Agent can't accidentally call with code=0 — the compiler catches it.
fn register_url(tracker: Map<Int, Int>, code: Int)
    requires { code > 0 }
{
    map_insert(tracker, code, 0)
}
```

```bash
kodoc build examples/url_shortener.ko -o url_shortener && ./url_shortener
kodoc confidence-report examples/url_shortener.ko
```

Source: [`examples/url_shortener.ko`](https://github.com/rfunix/kodo/blob/main/examples/url_shortener.ko)

---

## Word Counter — Ownership Prevents Agent Bugs

Demonstrates how `ref` borrowing prevents the most common bug AI agents introduce in systems languages: **use-after-move**. Without `ref`, calling `count_words(text)` would consume `text`, and the subsequent `text.length()` would fail with E0240.

**Kōdo-unique features:** `ref` borrowing (E0240 prevention), linear ownership (`own`), contracts on text processing, `@confidence` with forced review

```rust
// `ref text` borrows instead of moving — text stays usable after the call.
// Without ref, the caller couldn't use `text` again (E0240: use-after-move).
@authored_by(agent: "claude")
@confidence(0.95)
fn count_words(ref text: String) -> Int
    requires { text.length() > 0 }
{
    let mut count: Int = 0
    for word in text.split(" ") {
        if word.length() > 0 {
            count = count + 1
        }
    }
    return count
}

// ref borrows text — we can call count_words AND text.length()
// on the same value. In a move-based call, the second use would fail.
fn analyze(ref text: String) -> Stats {
    let w: Int = count_words(text)
    let c: Int = text.length()
    return Stats { words: w, chars: c }
}
```

```bash
kodoc build examples/word_counter.ko -o word_counter && ./word_counter
kodoc confidence-report examples/word_counter.ko
```

Source: [`examples/word_counter.ko`](https://github.com/rfunix/kodo/blob/main/examples/word_counter.ko)

---

## Config Validator — Refinement Types + Module Invariants

Configuration validation with **three layers of safety** that no other language provides simultaneously: refinement types constrain values at the type level, contracts verify logic at function boundaries, and module invariants enforce global conditions.

**Kōdo-unique features:** refinement types (`type Port`, `type MaxConns`), `invariant { }` (module-level), `@security_sensitive`, contracts, `ref` borrowing

```rust
// Module invariant: checked at entry of every function in this module.
invariant { 1 > 0 }

// Refinement types — invalid values can't even be constructed
type Port = Int requires { self >= 1 && self <= 65535 }
type MaxConns = Int requires { self > 0 && self <= 10000 }

// @security_sensitive: config validation is a trust boundary.
// The compiler won't let this function exist without contracts (E0262).
@security_sensitive
@authored_by(agent: "claude")
@confidence(0.95)
fn validate_port(port: Int) -> Bool
    requires { port >= 0 }
{
    return port >= 1 && port <= 65535
}
```

```bash
kodoc build examples/config_validator.ko -o config_validator && ./config_validator
kodoc confidence-report examples/config_validator.ko
```

Source: [`examples/config_validator.ko`](https://github.com/rfunix/kodo/blob/main/examples/config_validator.ko)

---

## HTTP Health Checker — Closed-Loop Agent Workflow

Shows the complete agent workflow: the agent writes code, the compiler verifies it, and when something breaks, `--json-errors` gives the agent structured output to fix it automatically. No other language has this **machine-first error protocol**.

**Kōdo-unique features:** `@security_sensitive` on network code, `@confidence` < 0.8 forcing `@reviewed_by`, `--json-errors` for machine consumption, `kodoc fix` for auto-repair

```rust
// @security_sensitive: network-facing code MUST have a contract.
// Without `requires`, the compiler rejects this function (E0262).
@security_sensitive
@authored_by(agent: "claude")
@confidence(0.9)
fn check_endpoint(name: String, url: String) -> Int
    requires { url.length() > 0 }
{
    let status: Int = http_get(url)
    if status == 0 {
        println(f"  [OK] {name}")
        return 1
    } else {
        println(f"  [FAIL] {name}")
        return 0
    }
}

// 0.75 < 0.8 → compiler requires @reviewed_by or won't compile.
@authored_by(agent: "claude")
@confidence(0.75)
@reviewed_by(human: "rafael")
fn summarize(results: List<Int>) {
    let total: Int = list_length(results)
    let healthy: Int = results.fold(0, |acc: Int, x: Int| -> Int { acc + x })
    println(f"Healthy: {healthy.to_string()}/{total.to_string()}")
}
```

```bash
kodoc build examples/health_checker.ko -o health_checker && ./health_checker
kodoc confidence-report examples/health_checker.ko
# Machine-readable errors for agent consumption:
kodoc check examples/health_checker.ko --json-errors
```

---

## Audit Log — Multi-File Showcase (15+ Features)

A complete audit log system for AI agents — meta-relevant: an auditable system written in the language designed for auditability. This is the most comprehensive example, combining **15+ Kōdo features across 3 files**.

**Kōdo-unique features:** multi-file imports, refinement types (`Timestamp`, `ConfidenceScore`), `@security_sensitive`, `@reviewed_by` (forced by low confidence), contracts (`requires`/`ensures`), module `invariant`, enums with exhaustive pattern matching, `List<T>` functional pipelines (`filter`/`map`/`fold`/`any`/`all`), `Map<String, Int>`, closures with captures, f-strings, `for-in`, `let mut`, native test framework

### `validation.ko` — Safety Layer

Refinement types constrain values at the type level. `@security_sensitive` forces the compiler to reject functions without contracts (E0262). Low-confidence code (`@confidence(0.7)`) requires `@reviewed_by` or compilation fails (E0260).

```rust
module validation {
    meta {
        purpose: "Audit entry validation with contract-verified safety"
        version: "1.0.0"
        author: "claude"
    }

    // Refinement types: constrain values at the type level.
    // Timestamps must be positive (epoch seconds).
    type Timestamp = Int requires { self > 0 }

    // Confidence scores: 0..100 inclusive.
    type ConfidenceScore = Int requires { self >= 0 && self <= 100 }

    // Severity levels: 1=Low, 2=Medium, 3=High, 4=Critical.
    enum Severity {
        Low,
        Medium,
        High,
        Critical
    }

    // Module invariant: checked at the entry of every function.
    invariant { 1 > 0 }

    // Maps enum variants to numeric levels via exhaustive pattern matching.
    // The compiler guarantees every variant is handled.
    pub
    @authored_by(agent: "claude")
    @confidence(0.98)
    fn severity_to_level(s: Severity) -> Int {
        let result: Int = match s {
            Severity::Low => 1,
            Severity::Medium => 2,
            Severity::High => 3,
            Severity::Critical => 4
        }
        return result
    }

    // Creates a Severity enum from a numeric level.
    pub
    @authored_by(agent: "claude")
    @confidence(0.95)
    fn level_to_severity(level: Int) -> Int
        requires { level >= 1 }
        requires { level <= 4 }
    {
        return level
    }

    // Validates an audit entry's fields.
    // @security_sensitive forces at least one contract — the compiler
    // will reject this function without requires/ensures (E0262).
    pub
    @security_sensitive
    @authored_by(agent: "claude")
    @confidence(0.92)
    fn validate_entry(agent_name_len: Int, severity_level: Int, timestamp: Int, confidence: Int) -> Bool
        requires { timestamp > 0 }
        requires { severity_level >= 1 }
        requires { severity_level <= 4 }
        requires { confidence >= 0 }
        requires { confidence <= 100 }
    {
        if agent_name_len <= 0 {
            return false
        }
        return true
    }

    // Determines if a severity level is critical (>= 3 = High or Critical).
    pub
    @authored_by(agent: "claude")
    @confidence(0.97)
    fn is_critical(level: Int) -> Bool
        requires { level >= 1 }
        requires { level <= 4 }
    {
        if level >= 3 {
            return true
        }
        return false
    }

    // Lower confidence function — requires @reviewed_by to compile.
    // Without the review annotation, the compiler rejects this (E0260).
    pub
    @authored_by(agent: "claude")
    @confidence(0.7)
    @reviewed_by(human: "rafael")
    fn confidence_meets_threshold(score: Int, threshold: Int) -> Bool
        requires { score >= 0 }
        requires { score <= 100 }
        requires { threshold >= 0 }
        requires { threshold <= 100 }
    {
        if score >= threshold {
            return true
        }
        return false
    }
}
```

### `main.ko` — Functional Pipelines + Agent Traceability

The main module imports `validation` and builds a full audit report using functional pipelines on `List<T>`, `Map<String, Int>` for aggregation, `for-in` loops with `let mut` accumulators, and f-string interpolation.

```rust
module main {
    import validation

    meta {
        purpose: "Audit log system showcasing 15+ Kodo features"
        version: "1.0.0"
        author: "claude"
    }

    // Creates a list of severity levels representing audit entries.
    // Each entry is encoded as: 1=Low, 2=Medium, 3=High, 4=Critical.
    @authored_by(agent: "claude")
    @confidence(0.95)
    fn create_severity_levels() -> List<Int> {
        let levels: List<Int> = list_new()

        // Agent "alpha" — routine operations
        list_push(levels, 1)
        list_push(levels, 2)

        // Agent "beta" — includes critical operations
        list_push(levels, 3)
        list_push(levels, 4)

        // Agent "gamma" — mixed severity
        list_push(levels, 1)
        list_push(levels, 3)

        // Agent "delta" — low severity monitoring
        list_push(levels, 2)
        list_push(levels, 1)

        return levels
    }

    // Creates a list of confidence scores for each entry (0-100).
    @authored_by(agent: "claude")
    @confidence(0.95)
    fn create_confidence_scores() -> List<Int> {
        let scores: List<Int> = list_new()
        list_push(scores, 95)
        list_push(scores, 88)
        list_push(scores, 72)
        list_push(scores, 60)
        list_push(scores, 91)
        list_push(scores, 85)
        list_push(scores, 78)
        list_push(scores, 93)
        return scores
    }

    fn main() -> Int {
        println("=== Audit Log Report ===")
        println("")

        // --- Data Creation ---
        let levels: List<Int> = create_severity_levels()
        let scores: List<Int> = create_confidence_scores()

        let total: Int = list_length(levels)
        println(f"Total entries: {total}")

        // --- Validation using imported contracts ---
        // validate_entry comes from the validation module with @security_sensitive
        let valid: Bool = validate_entry(5, 3, 1700000300, 72)
        if valid {
            println("Entry validation: PASSED")
        }

        // --- Functional Pipeline: filter critical entries ---
        // Closures with captures demonstrate Copy semantics for Int
        let critical_levels: List<Int> = levels.filter(|lvl: Int| -> Bool { lvl >= 3 })
        let critical_count: Int = list_length(critical_levels)
        println(f"Critical entries (severity >= 3): {critical_count}")

        // --- Functional Pipeline: map severity to risk scores ---
        // risk_score = level * 25 (maps 1-4 to 25-100)
        let risk_scores: List<Int> = levels.map(|lvl: Int| -> Int { lvl * 25 })

        // --- Fold: total risk score ---
        let total_risk: Int = risk_scores.fold(0, |acc: Int, r: Int| -> Int { acc + r })
        println(f"Total risk score: {total_risk}")

        // --- Any/All: compliance checks ---
        let has_critical: Bool = levels.any(|lvl: Int| -> Bool { lvl >= 4 })
        if has_critical {
            println("WARNING: Critical severity entries detected")
        }

        let all_valid_levels: Bool = levels.all(|lvl: Int| -> Bool { lvl >= 1 && lvl <= 4 })
        if all_valid_levels {
            println("All severity levels within valid range")
        }

        // --- Confidence analysis using functional pipeline ---
        let confidence_threshold: Int = 80
        let high_confidence: List<Int> = scores.filter(|s: Int| -> Bool { s >= 80 })
        let high_conf_count: Int = list_length(high_confidence)
        println(f"Entries above {confidence_threshold}% confidence: {high_conf_count}")

        // Use imported function with contracts
        let meets: Bool = confidence_meets_threshold(95, 80)
        if meets {
            println("Top agent meets confidence threshold")
        }

        // --- Map<String, Int>: count entries per agent ---
        let agent_counts: Map<String, Int> = map_new()
        map_insert(agent_counts, "alpha", 2)
        map_insert(agent_counts, "beta", 2)
        map_insert(agent_counts, "gamma", 2)
        map_insert(agent_counts, "delta", 2)

        println("")
        println("--- Entries per Agent ---")
        let alpha_count: Int = map_get(agent_counts, "alpha")
        let beta_count: Int = map_get(agent_counts, "beta")
        let gamma_count: Int = map_get(agent_counts, "gamma")
        let delta_count: Int = map_get(agent_counts, "delta")
        println(f"  alpha: {alpha_count}")
        println(f"  beta:  {beta_count}")
        println(f"  gamma: {gamma_count}")
        println(f"  delta: {delta_count}")

        // --- Severity distribution using mut accumulators and for-in ---
        let mut low_count: Int = 0
        let mut med_count: Int = 0
        let mut high_count: Int = 0
        let mut crit_count: Int = 0

        for lvl in levels {
            if lvl == 1 {
                low_count = low_count + 1
            }
            if lvl == 2 {
                med_count = med_count + 1
            }
            if lvl == 3 {
                high_count = high_count + 1
            }
            if lvl == 4 {
                crit_count = crit_count + 1
            }
        }

        println("")
        println("--- Severity Distribution ---")
        println(f"  Low:      {low_count}")
        println(f"  Medium:   {med_count}")
        println(f"  High:     {high_count}")
        println(f"  Critical: {crit_count}")

        // --- Use is_critical from validation module ---
        let beta_critical: Bool = is_critical(4)
        if beta_critical {
            println("")
            println("ALERT: Agent beta performed critical operations")
        }

        // --- Average confidence via fold ---
        let total_conf: Int = scores.fold(0, |acc: Int, s: Int| -> Int { acc + s })
        let avg_conf: Int = total_conf / total
        println(f"Average confidence: {avg_conf}%")

        println("")
        println("=== End of Report ===")

        return 0
    }
}
```

### `audit_log_test.ko` — Native Test Suite

Kōdo's built-in test framework with `test` blocks, `assert_eq`, `assert_true`, and `assert_false`. Run with `kodoc test` — no external test runner needed.

```rust
module audit_log_test {
    meta {
        purpose: "Test suite for audit log validation functions"
        version: "1.0.0"
        author: "claude"
    }

    enum Severity {
        Low,
        Medium,
        High,
        Critical
    }

    fn severity_to_level(s: Severity) -> Int {
        let result: Int = match s {
            Severity::Low => 1,
            Severity::Medium => 2,
            Severity::High => 3,
            Severity::Critical => 4
        }
        return result
    }

    fn is_critical(level: Int) -> Bool {
        if level >= 3 {
            return true
        }
        return false
    }

    fn confidence_meets_threshold(score: Int, threshold: Int) -> Bool {
        if score >= threshold {
            return true
        }
        return false
    }

    test "severity_to_level maps Low to 1" {
        assert_eq(severity_to_level(Severity::Low), 1)
    }

    test "severity_to_level maps Medium to 2" {
        assert_eq(severity_to_level(Severity::Medium), 2)
    }

    test "severity_to_level maps High to 3" {
        assert_eq(severity_to_level(Severity::High), 3)
    }

    test "severity_to_level maps Critical to 4" {
        assert_eq(severity_to_level(Severity::Critical), 4)
    }

    test "is_critical identifies high severity" {
        assert_true(is_critical(3))
        assert_true(is_critical(4))
    }

    test "is_critical rejects low severity" {
        assert_false(is_critical(1))
        assert_false(is_critical(2))
    }

    test "confidence threshold enforcement" {
        assert_true(confidence_meets_threshold(95, 80))
        assert_true(confidence_meets_threshold(80, 80))
        assert_false(confidence_meets_threshold(79, 80))
    }

    test "risk score calculation" {
        let levels: List<Int> = list_new()
        list_push(levels, 1)
        list_push(levels, 2)
        list_push(levels, 3)
        list_push(levels, 4)

        let risk_scores: List<Int> = levels.map(|lvl: Int| -> Int { lvl * 25 })
        let total_risk: Int = risk_scores.fold(0, |acc: Int, r: Int| -> Int { acc + r })
        assert_eq(total_risk, 250)
    }

    test "filter critical entries" {
        let levels: List<Int> = list_new()
        list_push(levels, 1)
        list_push(levels, 3)
        list_push(levels, 2)
        list_push(levels, 4)

        let critical: List<Int> = levels.filter(|lvl: Int| -> Bool { lvl >= 3 })
        assert_eq(list_length(critical), 2)
    }

    test "any detects critical entries" {
        let levels: List<Int> = list_new()
        list_push(levels, 1)
        list_push(levels, 2)
        list_push(levels, 4)

        let has_critical: Bool = levels.any(|lvl: Int| -> Bool { lvl >= 4 })
        assert_true(has_critical)
    }

    test "all validates severity range" {
        let levels: List<Int> = list_new()
        list_push(levels, 1)
        list_push(levels, 2)
        list_push(levels, 3)

        let all_valid: Bool = levels.all(|lvl: Int| -> Bool { lvl >= 1 && lvl <= 4 })
        assert_true(all_valid)
    }

    test "empty list produces zero risk" {
        let empty: List<Int> = list_new()
        let total: Int = empty.fold(0, |acc: Int, r: Int| -> Int { acc + r })
        assert_eq(total, 0)
    }
}
```

### Build, Test & Audit

```bash
# Compile and run
kodoc build examples/audit_log/main.ko -o audit_log && ./audit_log

# Run the 9 test cases
kodoc test examples/audit_log/audit_log_test.ko

# Agent trust audit — confidence scores, contract status, review annotations
kodoc confidence-report examples/audit_log/main.ko

# Full audit combining confidence + contracts + annotations
kodoc audit examples/audit_log/main.ko --json
```

Source: [`examples/audit_log/`](https://github.com/rfunix/kodo/blob/main/examples/audit_log/)
