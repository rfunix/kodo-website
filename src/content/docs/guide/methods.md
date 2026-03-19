---
title: "Methods"
sidebar:
  order: 8
---

Kōdo supports inherent impl blocks, which allow you to define methods directly on struct types without requiring a trait.

## Defining Methods

Use `impl TypeName { ... }` to add methods to a struct:

```rust
struct Point {
    x: Int,
    y: Int,
}

impl Point {
    fn translate(self, dx: Int, dy: Int) -> Point {
        return Point { x: self.x + dx, y: self.y + dy }
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

## Calling Methods

Methods are called using dot notation:

```rust
let p: Point = Point { x: 3, y: 4 }
let moved: Point = p.translate(1, 2)
let dist: Int = moved.manhattan_distance()
```

## Static Methods

Methods that don't take `self` as the first parameter act as static/associated functions:

```rust
struct Counter {
    value: Int
}

impl Counter {
    fn new() -> Counter {
        return Counter { value: 0 }
    }
}
```

```rust
let c: Counter = Counter.new()
```

## Inherent vs Trait Impl

- `impl Point { ... }` — inherent impl (no trait required)
- `impl Printable for Point { ... }` — trait impl (implements a trait)

Both can coexist for the same type.

## Method Chaining

Since methods that return `Self` (or the same struct type) produce a new value, you can chain method calls by assigning intermediate results:

```rust
let c: Counter = Counter { value: 0 }
let c2: Counter = c.increment()
let c3: Counter = c2.increment()
print_int(c3.get())  // 2
```

This works because `increment` returns a new `Counter` each time. In Kodo, the `self` receiver takes the value by ownership, so each call consumes the previous value and produces a new one.

## Builder Pattern

You can use the returning-self pattern to build up struct values step by step:

```rust
struct Config {
    port: Int,
    host: String,
    max_connections: Int
}

impl Config {
    fn new() -> Config {
        return Config { port: 8080, host: "localhost", max_connections: 100 }
    }

    fn with_port(self, port: Int) -> Config {
        return Config { port: port, host: self.host, max_connections: self.max_connections }
    }

    fn with_host(self, host: String) -> Config {
        return Config { port: self.port, host: host, max_connections: self.max_connections }
    }

    fn with_max_connections(self, n: Int) -> Config {
        return Config { port: self.port, host: self.host, max_connections: n }
    }
}
```

```rust
let base: Config = Config.new()
let c1: Config = base.with_port(3000)
let c2: Config = c1.with_host("0.0.0.0")
let c3: Config = c2.with_max_connections(500)
```

Each `with_*` method takes ownership of `self`, modifies one field, and returns a new `Config`. This is the idiomatic way to build complex values in Kodo.

## Methods on Enums

Methods work on built-in enum types like `Option<T>` and `Result<T, E>`:

```rust
let opt: Option<Int> = Option::Some(42)
let is_present: Bool = opt.is_some()      // true
let is_empty: Bool = opt.is_none()        // false
let val: Int = opt.unwrap_or(0)           // 42

let none_opt: Option<Int> = Option::None
let fallback: Int = none_opt.unwrap_or(99)  // 99
```

```rust
let ok_res: Result<Int, String> = Result::Ok(10)
let is_ok: Bool = ok_res.is_ok()          // true
let is_err: Bool = ok_res.is_err()        // false
let ok_val: Int = ok_res.unwrap_or(0)     // 10

let err_res: Result<Int, String> = Result::Err("failed")
let err_val: Int = err_res.unwrap_or(42)  // 42
```

Available enum methods:

| Type | Method | Returns | Description |
|------|--------|---------|-------------|
| `Option<T>` | `is_some()` | `Bool` | True if `Some` |
| `Option<T>` | `is_none()` | `Bool` | True if `None` |
| `Option<T>` | `unwrap()` | `T` | Extracts value, aborts if `None` |
| `Option<T>` | `unwrap_or(default)` | `T` | Returns value or the default |
| `Result<T, E>` | `is_ok()` | `Bool` | True if `Ok` |
| `Result<T, E>` | `is_err()` | `Bool` | True if `Err` |
| `Result<T, E>` | `unwrap()` | `T` | Extracts value, aborts if `Err` |
| `Result<T, E>` | `unwrap_or(default)` | `T` | Returns value or the default |
| `Result<T, E>` | `unwrap_err()` | `E` | Extracts error, aborts if `Ok` |

## Methods with Closure Parameters

Methods can accept closures as arguments, enabling higher-order patterns:

```rust
struct Box {
    value: Int
}

impl Box {
    fn apply(self, f: (Int) -> Int) -> Int {
        return f(self.value)
    }
}
```

```rust
let b: Box = Box { value: 10 }
let result: Int = b.apply(|x: Int| -> Int { x * 2 })  // 20
```

## The `self` Receiver

In Kodo, the `self` parameter in methods always takes the value by ownership. This means:

- After calling `p.translate(1, 2)`, the original `p` is consumed (moved).
- If you need to use a value after a method call, the method should return a new value.
- For types like `Int`, `Bool`, and `Float64` that are `Copy`, `self` is implicitly copied and the original remains usable.

For standalone functions (not methods), Kodo supports explicit ownership annotations on parameters (`own`, `ref`, `mut`), but method receivers always use the default `self` by-value semantics.
