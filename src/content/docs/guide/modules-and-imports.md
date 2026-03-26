---
title: "Modules & Imports"
sidebar:
  order: 12
---

# Modules and Imports

Kōdo programs can span multiple files. Each file contains a single module, and modules can import functions and types from other modules.

## Module Structure

Every `.ko` file contains exactly one module:

```rust
module my_module {
    meta {
        purpose: "What this module does"
        version: "0.1.0"
    }

    // functions, types, etc.
}
```

The module name should match the filename (e.g., `math.ko` contains `module math`).

## Importing Modules

Use `import` to bring another module's definitions into scope:

```rust
import math
```

This makes all functions and types defined in `math.ko` available in the current module.

### Import Resolution

When the compiler sees `import math`, it looks for `math.ko` in the same directory as the importing file. The imported module is compiled first, and its exported definitions are made available.

### Example: Two-File Program

**`math.ko`** — a utility module:

```rust
module math {
    meta {
        purpose: "Math utilities"
        version: "0.1.0"
    }

    pub fn add(a: Int, b: Int) -> Int {
        return a + b
    }

    pub fn multiply(a: Int, b: Int) -> Int {
        return a * b
    }
}
```

**`main.ko`** — uses the math module:

```rust
module main {
    import math

    meta {
        purpose: "Main program"
        version: "0.1.0"
    }

    fn main() {
        let sum: Int = add(3, 4)
        let product: Int = multiply(5, 6)
        print_int(sum)
        print_int(product)
    }
}
```

Compile and run:

```bash
cargo run -p kodoc -- build main.ko -o main
./main
```

Output:
```rust
7
30
```

The compiler resolves the import, compiles `math.ko`, and links everything into a single binary.

## The Standard Library Prelude

Kōdo's standard library provides two foundational types that are available in every program without an explicit import:

- **`Option<T>`** — represents an optional value (`Some(T)` or `None`)
- **`Result<T, E>`** — represents success or failure (`Ok(T)` or `Err(E)`)

These types are automatically injected before your code is type-checked. You can use them immediately:

```rust
module my_program {
    meta {
        purpose: "Using stdlib types"
        version: "0.1.0"
    }

    fn maybe_double(x: Int) -> Option<Int> {
        if x > 0 {
            return Option::Some(x * 2)
        }
        return Option::None
    }

    fn main() {
        let result: Option<Int> = maybe_double(21)
        match result {
            Option::Some(v) => { print_int(v) }
            Option::None => { println("nothing") }
        }
    }
}
```

Output: `42`

## Built-in Collection Types

Kōdo provides built-in collection types (`List<T>`, `Map<K, V>`) and string methods that are available in every program without an import. See [Data Types](../data-types#collections) for the full API reference and usage examples.

## Qualified Imports with `::`

You can use `::` as a path separator for imports, particularly useful for standard library modules:

```rust
import std::option
import std::result
```

The dot separator (`.`) is also supported for backward compatibility:

```rust
import math.utils
```

Both forms resolve to the same module.

### Selective Imports with `from...import`

To bring specific names from a module into scope, use the `from...import` syntax:

```rust
from std::option import Some, None
from math::utils import add, multiply
```

This imports only the named items, keeping the local scope clean.

## Qualified Calls

When importing a module, you can use qualified calls with dot notation or `::`:

```rust
import math
let result: Int = math.add(1, 2)
let result2: Int = math::add(1, 2)
```

This is equivalent to calling `add(1, 2)` directly — the module prefix makes the origin explicit.

## Visibility

By default, all declarations in a module are **private** — they can only be used within the same module. Use the `pub` keyword to make them accessible from other modules.

### Public vs Private

```rust
module auth {
    meta { purpose: "Authentication utilities" }

    pub struct User {
        name: String,
        role: String
    }

    pub fn create_user(name: String, role: String) -> User {
        return User { name: name, role: role }
    }

    fn validate_name(name: String) -> String {
        return name
    }
}
```

Importing `auth` gives access to `User` and `create_user`, but not `validate_name`.

### What Can Be `pub`

| Declaration | Default | With `pub` |
|-------------|---------|------------|
| `fn` | Private | Callable from other modules |
| `struct` | Private | Usable as a type from other modules |
| `enum` | Private | Usable as a type from other modules |
| `trait` | Private | Implementable from other modules |

## Compilation Certificates

When you compile a Kōdo program, the compiler emits a **compilation certificate** alongside the binary. For `hello.ko`, the compiler creates `hello.ko.cert.json`:

```json
{
  "module": "hello",
  "purpose": "My first Kōdo program",
  "version": "0.1.0",
  "contracts": {
    "requires_count": 1,
    "ensures_count": 1,
    "mode": "static",
    "static_verified": 1,
    "runtime_checks_needed": 1,
    "failures": 0
  },
  "functions": ["main", "validate"],
  "confidence": [
    {
      "name": "main",
      "declared": 0.95,
      "effective": 0.90,
      "callees": ["validate"]
    },
    {
      "name": "validate",
      "declared": 0.90,
      "effective": 0.90,
      "callees": []
    }
  ],
  "source_hash": "sha256:...",
  "binary_hash": "sha256:...",
  "certificate_hash": "sha256:..."
}
```

This certificate is a machine-readable record of what was compiled. AI agents can use certificates to verify:

- What the module claims to do (from `meta`)
- How many contracts are in place, and which were statically verified vs runtime-checked
- Per-function confidence scores (declared and effective after transitive propagation)
- Whether the source has changed since the last compilation

Use `kodoc audit <file> --json` for a consolidated report combining confidence, contracts, and annotations with a deployability verdict.

## Next Steps

- [Error Handling](../error-handling) — using `Option<T>` and `Result<T, E>`
- [CLI Reference](../cli-reference) — all `kodoc` commands and flags
- [Language Basics](../language-basics) — types, variables, and control flow
