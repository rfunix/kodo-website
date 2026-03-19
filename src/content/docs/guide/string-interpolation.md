---
title: "String Interpolation"
sidebar:
  order: 11
---

Kōdo supports f-strings for embedding expressions inside string literals.

## Basic Usage

Prefix a string literal with `f` and use `{expression}` to embed values:

```rust
let name: String = "World"
let msg: String = f"Hello, {name}!"
// msg == "Hello, World!"
```

## Expressions in Interpolation

Any expression can be embedded, including function calls, arithmetic, and field access:

```rust
let x: Int = 3
let y: Int = 4
let desc: String = f"Point({x}, {y})"

let sum: String = f"Total: {x + y}"
```

## Type Conversion

Non-string types are automatically converted using built-in `to_string` functions:

- `Int` → `kodo_int_to_string`
- `Float64` → `kodo_float_to_string`
- `Bool` → `kodo_bool_to_string`

## How It Works

F-strings are desugared during compilation into string concatenation:

```rust
f"Hello, {name}!"
// becomes:
"Hello, " + name + "!"
```

For non-string expressions, a `to_string` call is inserted automatically.

## Escape Sequences

Kodo supports the following escape sequences in both regular strings and f-strings:

| Sequence | Character | Description |
|----------|-----------|-------------|
| `\"` | `"` | Double quote |
| `\\` | `\` | Backslash |
| `\n` | newline | Line feed |
| `\t` | tab | Horizontal tab |
| `\r` | return | Carriage return |
| `\0` | null | Null character |

```rust
let line_break: String = "line1\nline2"
let tabbed: String = "col1\tcol2"
let quoted: String = "she said \"hello\""
let path: String = "C:\\Users\\kodo"
```

Escape sequences also work inside f-strings:

```rust
let name: String = "World"
let msg: String = f"Hello,\n\t{name}!"
// Result: Hello,
//     World!
```

Unknown escape sequences (e.g., `\q`) are kept as-is.

## Multi-Expression F-Strings

F-strings can contain multiple interpolated expressions in a single string:

```rust
let x: Int = 3
let y: Int = 4
let desc: String = f"Point({x}, {y})"
// desc == "Point(3, 4)"
```

```rust
let first: String = "Jane"
let last: String = "Doe"
let age: Int = 30
let record: String = f"{first} {last}, age {age}"
// record == "Jane Doe, age 30"
```

You can mix literal text and expressions freely:

```rust
let a: Int = 10
let b: Int = 20
let c: Int = 30
let summary: String = f"{a} + {b} + {c} = {a + b + c}"
// summary == "10 + 20 + 30 = 60"
```

## Practical Examples

### Logging and Debug Output

```rust
fn log_request(method: String, path: String, status: Int) {
    println(f"{method} {path} -> {status}")
}
```

### Formatting Struct Fields

```rust
struct Point {
    x: Int,
    y: Int,
}

impl Point {
    fn to_string(self) -> String {
        return f"({self.x}, {self.y})"
    }

    fn manhattan_distance(self) -> Int {
        let ax: Int = self.x
        if ax < 0 { ax = 0 - ax }
        let ay: Int = self.y
        if ay < 0 { ay = 0 - ay }
        return ax + ay
    }
}
```

```rust
let p: Point = Point { x: 3, y: 4 }
println(f"Point at {p.to_string()} with distance {p.manhattan_distance()}")
```

### Constructing Structured Text

```rust
let key: String = "name"
let value: String = "kodo"
let pair: String = f"{key}: \"{value}\""
// pair == "name: \"kodo\""
```

## Edge Cases

### Empty Strings and F-Strings

A regular empty string works as expected:

```rust
let empty: String = ""
```

An f-string with no interpolations is equivalent to a regular string:

```rust
let plain: String = f"no interpolation here"
```

### Adjacent Interpolations

Multiple `{expr}` blocks can appear next to each other without separator text:

```rust
let a: String = "hello"
let b: String = "world"
let joined: String = f"{a}{b}"
// joined == "helloworld"
```

### Expressions in Interpolation

You can use arithmetic and function calls directly inside `{}`:

```rust
let count: Int = 42
let msg: String = f"The answer is {count}"
let calc: String = f"Double: {count * 2}"
```

## Restrictions

- F-strings cannot be used inside contract expressions (`requires`/`ensures`).
- Nested f-strings are not supported in v1.
