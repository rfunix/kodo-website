---
title: "Pattern Matching"
sidebar:
  order: 3
---

Kōdo provides exhaustive pattern matching on enum types using `match` expressions. The compiler verifies that all variants are handled, preventing bugs from unmatched cases.

## Basic Match

```rust
enum Direction {
    North,
    South,
    East,
    West
}

fn describe(d: Direction) -> String {
    match d {
        Direction::North => { return "Going north" }
        Direction::South => { return "Going south" }
        Direction::East => { return "Going east" }
        Direction::West => { return "Going west" }
    }
}
```

## Match with Payload

Enum variants can carry data, which you can destructure in match arms:

```rust
enum Shape {
    Circle(Int),
    Rectangle(Int, Int)
}

fn area(s: Shape) -> Int {
    match s {
        Shape::Circle(r) => { return r * r * 3 }
        Shape::Rectangle(w, h) => { return w * h }
    }
}
```

## Wildcard Patterns

Use `_` as a catch-all pattern to match any variant you don't need to handle individually. The wildcard satisfies exhaustiveness without naming every variant:

```rust
enum Color {
    Red,
    Green,
    Blue,
    Yellow,
    Cyan
}

fn is_primary(c: Color) -> Bool {
    let result: Bool = match c {
        Color::Red => true,
        Color::Blue => true,
        _ => false
    }
    return result
}
```

The wildcard must appear as the last arm. It matches any variant not covered by earlier arms.

## Literal Patterns

Match arms can match against integer, float, string, and boolean literals:

```rust
fn describe_score(score: Int) -> String {
    match score {
        0 => { return "zero" }
        1 => { return "one" }
        100 => { return "perfect" }
        _ => { return "other" }
    }
}
```

Boolean literals work the same way:

```rust
fn bool_to_string(b: Bool) -> String {
    match b {
        true => { return "yes" }
        false => { return "no" }
    }
}
```

## Exhaustiveness

The compiler requires all variants to be handled. Missing a variant produces a compile-time error, ensuring no unmatched cases at runtime. You can use a wildcard `_` arm to cover all remaining variants without listing each one explicitly.

## Match with Option

`Option<T>` has two variants: `Option::Some(value)` and `Option::None`. Pattern matching is the primary way to extract the inner value:

```rust
fn find_positive(a: Int) -> Option<Int> {
    if a > 0 { return Option::Some(a) }
    return Option::None
}

fn main() {
    let r: Option<Int> = find_positive(42)
    let value: Int = match r {
        Option::Some(v) => v,
        Option::None => 0
    }
    print_int(value)
}
```

You can also use `Option<T>` with different inner types in the same module:

```rust
let int_opt: Option<Int> = Option::Some(42)
let str_opt: Option<String> = Option::Some("hello")

let n: Int = match int_opt {
    Option::Some(v) => v,
    Option::None => 0
}

let s: String = match str_opt {
    Option::Some(v) => v,
    Option::None => "default"
}
```

For simple cases where you just need a default value, `Option` also provides helper methods:

```rust
let opt: Option<Int> = Option::Some(42)
let val: Int = opt.unwrap_or(0)
let present: Bool = opt.is_some()
let absent: Bool = opt.is_none()
```

Kōdo also supports `if let` for concise single-variant matching on `Option`:

```rust
fn describe_option(opt: Option<Int>) -> Int {
    if let Option::Some(value) = opt {
        return value
    } else {
        return 0
    }
}
```

## Match with Result

`Result<T, E>` has two variants: `Result::Ok(value)` and `Result::Err(error)`. Use match to handle both success and failure paths:

```rust
fn validate(n: Int) -> Result<Int, String> {
    if n > 0 {
        return Result::Ok(n * 2)
    } else {
        return Result::Err("not positive")
    }
}

fn main() -> Int {
    let result: Result<Int, String> = validate(5)
    match result {
        Result::Ok(v) => {
            print_int(v)
        }
        Result::Err(e) => {
            println("error")
        }
    }
    return 0
}
```

When both `T` and `E` are the same type, you can use the match expression inline to extract the value:

```rust
let r: Result<Int, Int> = Result::Ok(100)
let x: Int = match r {
    Result::Ok(v) => v,
    Result::Err(e) => e
}
```

`Result` also provides helper methods for simpler checks:

```rust
let ok_res: Result<Int, String> = Result::Ok(10)
let is_ok: Bool = ok_res.is_ok()
let is_err: Bool = ok_res.is_err()
let val: Int = ok_res.unwrap_or(0)
```

### The `?` Operator

For functions that return `Result`, the `?` operator provides concise error propagation. It extracts the `Ok` value or returns the `Err` early:

```rust
fn process(n: Int) -> Result<Int, String> {
    let doubled: Int = validate(n)?
    let result: Result<Int, String> = Result::Ok(doubled + 10)
    return result
}
```

This desugars to a full match expression that returns `Result::Err` on the error path.

## When to Use Match vs If

Use `match` when:

- You need to handle multiple variants of an enum. The compiler ensures exhaustiveness, so you cannot forget a case.
- You want to destructure payload data from enum variants.
- You need to branch on several literal values.

Use `if` / `if let` when:

- You only care about one specific variant and want a default for everything else.
- You are checking a simple boolean condition.
- You want to test an `Option` without writing a full match block.

```rust
// Prefer match: handling all variants explicitly
let msg: String = match direction {
    Direction::North => "up",
    Direction::South => "down",
    Direction::East => "right",
    Direction::West => "left"
}

// Prefer if let: only care about one variant
if let Option::Some(value) = maybe_value {
    print_int(value)
} else {
    println("nothing")
}
```

## Current Limitations

- **No nested patterns**: variant bindings are simple identifiers. You cannot write `Option::Some(Option::Some(x))`; instead, match the outer layer and then match the inner value in a separate step.
- **No guard clauses**: match arms do not support `if` conditions. Use nested `if` statements inside the arm body instead.
- **No tuple destructuring in match**: while tuple patterns `(a, b)` are parsed, tuple types are not yet fully supported in match expressions. Use enums instead.

## Examples

See these files in the repository for complete working examples:

- [`examples/enums.ko`](https://github.com/rfunix/kodo/blob/main/examples/enums.ko) -- enum types and match expressions
- [`examples/enum_params.ko`](https://github.com/rfunix/kodo/blob/main/examples/enum_params.ko) -- enums as function parameters and return values
- [`examples/option_demo.ko`](https://github.com/rfunix/kodo/blob/main/examples/option_demo.ko) -- Option type with match
- [`examples/result_demo.ko`](https://github.com/rfunix/kodo/blob/main/examples/result_demo.ko) -- Result type with match
- [`examples/try_operator_sugar.ko`](https://github.com/rfunix/kodo/blob/main/examples/try_operator_sugar.ko) -- the `?` operator for error propagation
- [`examples/enum_methods.ko`](https://github.com/rfunix/kodo/blob/main/examples/enum_methods.ko) -- helper methods on Option and Result
- [`examples/flow_typing.ko`](https://github.com/rfunix/kodo/blob/main/examples/flow_typing.ko) -- `if let` with Option
