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

## Exhaustiveness

The compiler requires all variants to be handled. Missing a variant produces a compile-time error, ensuring no unmatched cases at runtime.

## Option and Result

Pattern matching is the primary way to work with `Option<T>` and `Result<T, E>`:

```rust
fn describe_result(r: Result<Int, String>) -> String {
    match r {
        Result::Ok(v) => { return "success" }
        Result::Err(e) => { return "failure" }
    }
}
```

`list_get` returns the element directly (not wrapped in `Option`), but many standard library functions like `file_read` return `Result<T, E>` that must be matched.

## Example

See [`examples/enums.ko`](https://github.com/rfunix/kodo/blob/main/examples/enums.ko) for a complete working example with enum types and pattern matching.
