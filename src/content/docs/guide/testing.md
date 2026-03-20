---
title: "Testing"
sidebar:
  order: 20
---

# Testing

Kōdo has a built-in testing framework. Tests are first-class constructs in the language — you write them alongside your code using the `test` keyword, and run them with `kodoc test`.

## Writing Tests

A test block uses the `test` keyword followed by a string literal name and a body:

```rust
module math_utils {
    meta {
        purpose: "Math utilities with tests"
    }

    fn add(a: Int, b: Int) -> Int {
        return a + b
    }

    fn multiply(a: Int, b: Int) -> Int {
        return a * b
    }

    test "add returns correct sum" {
        assert_eq(add(2, 3), 5)
        assert_eq(add(-1, 1), 0)
        assert_eq(add(0, 0), 0)
    }

    test "multiply returns correct product" {
        assert_eq(multiply(3, 4), 12)
        assert_eq(multiply(0, 5), 0)
    }
}
```

Tests live inside the same module as the code they test. Each test block has a descriptive name (a string literal) and a body containing assertions.

## Assertions

Kōdo provides these built-in assertion functions:

| Assertion | Signature | Description |
|-----------|-----------|-------------|
| `assert` | `assert(Bool)` | Fails if the value is `false` |
| `assert_true` | `assert_true(Bool)` | Fails if the value is `false` (alias for `assert`) |
| `assert_false` | `assert_false(Bool)` | Fails if the value is `true` |
| `assert_eq` | `assert_eq(T, T)` | Fails if left and right are not equal |
| `assert_ne` | `assert_ne(T, T)` | Fails if left and right are equal |

`assert_eq` and `assert_ne` support these types: `Int`, `String`, `Bool`, and `Float64`. Both operands must be the same type.

## Running Tests

Use `kodoc test` to run tests in a file:

```bash
# Run all tests in a file
kodoc test examples/testing.ko

# Run only tests whose name matches a pattern
kodoc test examples/testing.ko --filter "add"

# Output results as JSON (for agent consumption)
kodoc test examples/testing.ko --json
```

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | All tests passed |
| `1` | One or more tests failed |

## Describe Blocks

Group related tests with `describe`. Use `setup` and `teardown` for shared initialization:

```rust
describe "arithmetic" {
    setup {
        let base: Int = 100
    }

    teardown {
        // cleanup after each test
    }

    test "addition" {
        assert_eq(base + 1, 101)
    }

    test "subtraction" {
        assert_eq(base - 50, 50)
    }
}
```

- `setup` runs before **each** test in the describe block
- `teardown` runs after **each** test
- Variables from `setup` are visible in all tests
- Describe blocks can be nested; test names become hierarchical: `"arithmetic > addition"`

## Skip and Todo

Mark tests to be skipped or as future work:

```rust
@skip("waiting for async support")
test "async operation" {
    assert(false)
}

@todo("implement when ready")
test "future feature" {
    assert(false)
}
```

Skipped and todo tests are reported separately in the summary and don't count as failures.

## Timeout

Set a time limit for individual tests:

```rust
@timeout(5000)  // milliseconds
test "long computation" {
    // aborts if it takes more than 5 seconds
}
```

## Property-Based Testing

Use `@property` and `forall` to test properties with random inputs:

```rust
@property(iterations: 100)
test "addition is commutative" {
    forall a: Int, b: Int {
        assert_eq(a + b, b + a)
    }
}

@property(iterations: 50, seed: 42)
test "abs is non-negative" {
    forall x: Int {
        assert(abs_val(x) >= 0)
    }
}
```

**Annotation parameters:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `iterations` | 100 | Number of random inputs |
| `seed` | 0 (random) | Deterministic seed for reproducibility |
| `int_min` | -1000000 | Min value for Int generation |
| `int_max` | 1000000 | Max value for Int generation |

**Supported types in `forall`:** `Int`, `Bool`, `Float64`, `String`.

When a property test fails, the runtime performs basic shrinking — attempting smaller inputs to find a minimal failing case.

## Generating Tests from Contracts

Use `kodoc generate-tests` to auto-generate test stubs from function contracts:

```bash
# Generate tests to a separate file
kodoc generate-tests mymodule.ko

# Append tests inline to the source file
kodoc generate-tests mymodule.ko --inline

# Print generated tests to stdout
kodoc generate-tests mymodule.ko --stdout
```

Given a function with contracts:
```rust
fn safe_divide(a: Int, b: Int) -> Int
    requires { b != 0 }
    ensures  { result >= 0 }
{ ... }
```

The generator produces:
```rust
test "safe_divide: basic call" {
    // TODO: call safe_divide() with valid arguments
}

@property(iterations: 100)
test "safe_divide: postcondition holds" {
    forall a: Int, b: Int {
        // TODO: add precondition guard and postcondition assertion
    }
}
```

## Annotations on Tests

Tests support the same annotations as functions — `@confidence` and `@authored_by`:

```rust
@confidence(0.95)
@authored_by(agent: "claude")
test "critical invariant holds" {
    let result: Int = compute_critical_value()
    assert_eq(result, 42)
}
```

This integrates with Kōdo's agent traceability system. See [Agent Traceability](../agent-traceability) for details.

## How Test Mode Works

When you run `kodoc test`, the compiler:

1. Parses the file normally, collecting all `test` and `describe` blocks.
2. Flattens describe blocks into individual tests with hierarchical names and injected setup/teardown.
3. Desugars each test into a regular function and generates a synthetic `main` that runs them.
4. Compiles and runs the resulting program.

Tests have full access to all functions and types defined in the module — no special imports needed.

## Known Limitations

- **Single file only**: `kodoc test` currently runs tests within a single file. Cross-file test discovery is not yet supported.
- **Property test types**: `forall` currently supports `Int`, `Bool`, `Float64`, and `String`. Collection types (`List`, `Map`) in forall bindings are planned.
- **Shrinking**: Basic shrinking only (divide toward zero). Compositional shrinking across multiple variables is planned.

## Examples

See these files in the repository for complete working examples:

- [`examples/testing.ko`](https://github.com/rfunix/kodo/blob/main/examples/testing.ko) — basic test blocks with assertions
- [`examples/test_describe.ko`](https://github.com/rfunix/kodo/blob/main/examples/test_describe.ko) — describe blocks with setup
- [`examples/test_property.ko`](https://github.com/rfunix/kodo/blob/main/examples/test_property.ko) — property-based testing
- [`examples/test_contracts.ko`](https://github.com/rfunix/kodo/blob/main/examples/test_contracts.ko) — testing with contracts
