---
title: "Data Types"
sidebar:
  order: 2
---

Kōdo has a rich type system with primitive types, composite types (`struct`, `enum`), generics, and collections. There is no null — use `Option<T>` instead. There are no exceptions — use `Result<T, E>` instead.

## Primitive Types

Every value in Kōdo has a known type at compile time. The built-in primitive types are:

| Type | Description | Example |
|------|-------------|---------|
| `Int` | 64-bit signed integer (default) | `42`, `-1`, `0` |
| `Int8` | 8-bit signed integer | `127` |
| `Int16` | 16-bit signed integer | `32000` |
| `Int32` | 32-bit signed integer | `2_000_000` |
| `Int64` | 64-bit signed integer (same as `Int`) | `9_000_000_000` |
| `Uint` | 64-bit unsigned integer | `0` |
| `Uint8` | 8-bit unsigned integer | `255` |
| `Uint16` | 16-bit unsigned integer | `65535` |
| `Uint32` | 32-bit unsigned integer | `4_294_967_295` |
| `Uint64` | 64-bit unsigned integer | `0` |
| `Float32` | 32-bit floating point | `3.14` |
| `Float64` | 64-bit floating point (default float) | `2.718281828` |
| `Bool` | Boolean | `true`, `false` |
| `String` | UTF-8 string | `"hello"` |
| `Byte` | Single byte (8-bit unsigned) | `0` |
| `Unit` | No value (like `void`) | implicit |

### Integers

`Int` is the default integer type — 64-bit signed. Use the sized variants when you need explicit control over memory layout:

```rust
let count: Int = 42
let small: Int8 = 100
let big: Uint64 = 18_446_744_073_709_551_615
```

All integer types support arithmetic (`+`, `-`, `*`, `/`, `%`), comparison (`==`, `!=`, `<`, `>`, `<=`, `>=`), and bitwise operations. Integer overflow wraps silently (two's complement).

### Booleans

```rust
let active: Bool = true
let done: Bool = false

if active {
    println("still running")
}
```

Booleans support `&&` (and), `||` (or), and `!` (not).

### Strings

Strings are UTF-8, heap-allocated, and reference-counted. They support escape sequences (`\"`, `\\`, `\n`, `\t`, `\r`, `\0`) and f-string interpolation:

```rust
let name: String = "Kōdo"
let greeting: String = f"Hello, {name}!"
let escaped: String = "line1\nline2"
```

See [String Interpolation](../string-interpolation/) for f-strings and [Standard Library](../stdlib-reference/) for string methods (`length`, `contains`, `split`, `replace`, `trim`, etc.).

### No Null, No Exceptions

Kōdo has no `null` and no exceptions. Instead:

- **Optional values** use `Option<T>` — either `Option::Some(value)` or `Option::None`
- **Fallible operations** use `Result<T, E>` — either `Result::Ok(value)` or `Result::Err(error)`

```rust
let found: Option<Int> = Option::Some(42)
let missing: Option<Int> = Option::None

let ok: Result<String, String> = Result::Ok("success")
let err: Result<String, String> = Result::Err("not found")
```

See [Error Handling](../error-handling/) for details on `Option` and `Result`.

## Structs

A struct groups related values under named fields:

```rust
struct Point {
    x: Int,
    y: Int
}
```

### Creating Structs

Create a struct value by providing all fields:

```rust
let origin: Point = Point { x: 0, y: 0 }
let p: Point = Point { x: 3, y: 4 }
```

### Accessing Fields

Use dot notation to access individual fields:

```rust
fn get_x(p: Point) -> Int {
    return p.x
}

fn main() {
    let p: Point = Point { x: 10, y: 20 }
    print_int(p.x)
    print_int(p.y)
}
```

### Structs as Function Parameters

Structs can be passed to and returned from functions:

```rust
struct Point {
    x: Int,
    y: Int
}

fn translate(p: Point, dx: Int, dy: Int) -> Point {
    return Point { x: p.x + dx, y: p.y + dy }
}

fn main() {
    let p: Point = Point { x: 1, y: 2 }
    let q: Point = translate(p, 10, 20)
    print_int(q.x)
    print_int(q.y)
}
```

Output:
```rust
11
22
```

Internally, structs are passed by pointer — there is no copy overhead for large structs.

## Enums

An enum defines a type that can be one of several named variants. Each variant can optionally carry data:

```rust
enum Color {
    Red,
    Green,
    Blue
}

enum Shape {
    Circle(Int),
    Rectangle(Int, Int)
}
```

`Color` has three variants with no data. `Shape` has two variants: `Circle` carries a radius (`Int`) and `Rectangle` carries width and height (`Int, Int`).

### Creating Enum Values

Use the `EnumName::Variant(args)` syntax:

```rust
let s: Shape = Shape::Circle(5)
let r: Shape = Shape::Rectangle(10, 20)
```

### Pattern Matching with `match`

`match` is the primary way to work with enums. It destructures the value and binds contained data to variables:

```rust
fn area(s: Shape) -> Int {
    match s {
        Shape::Circle(r) => {
            return r * r * 3
        }
        Shape::Rectangle(w, h) => {
            return w * h
        }
    }
}
```

Each arm of a `match` specifies a pattern (`Shape::Circle(r)`) and a body to execute when the value matches that pattern. The contained values are bound to the names you choose (`r`, `w`, `h`).

### Match is Exhaustive

Every `match` must cover all variants. If you forget one, the compiler will tell you. This prevents a common category of bugs where a new variant is added but not handled everywhere.

### Enums as Function Parameters

Like structs, enums can be passed to and returned from functions:

```rust
enum Direction {
    Up,
    Down,
    Left,
    Right
}

fn move_point(p: Point, dir: Direction, amount: Int) -> Point {
    match dir {
        Direction::Up => {
            return Point { x: p.x, y: p.y + amount }
        }
        Direction::Down => {
            return Point { x: p.x, y: p.y - amount }
        }
        Direction::Left => {
            return Point { x: p.x - amount, y: p.y }
        }
        Direction::Right => {
            return Point { x: p.x + amount, y: p.y }
        }
    }
}
```

## Complete Example

Here's a program that combines structs, enums, and pattern matching:

```rust
module geometry {
    meta {
        purpose: "Calculate areas of shapes"
        version: "0.1.0"
    }

    struct Point {
        x: Int,
        y: Int
    }

    enum Shape {
        Circle(Int),
        Square(Int),
        Rectangle(Int, Int)
    }

    fn area(s: Shape) -> Int {
        match s {
            Shape::Circle(r) => {
                return r * r * 3
            }
            Shape::Square(side) => {
                return side * side
            }
            Shape::Rectangle(w, h) => {
                return w * h
            }
        }
    }

    fn main() {
        let c: Shape = Shape::Circle(5)
        let sq: Shape = Shape::Square(4)
        let r: Shape = Shape::Rectangle(3, 7)

        print_int(area(c))
        print_int(area(sq))
        print_int(area(r))
    }
}
```

Output:
```rust
75
16
21
```

## Float64

Kōdo supports 64-bit floating-point numbers with full arithmetic:

```rust
let pi: Float64 = 3.14159
let radius: Float64 = 5.0
let area: Float64 = pi * radius * radius

println_float(area)
```

All arithmetic (`+`, `-`, `*`, `/`, `%`), comparison (`==`, `!=`, `<`, `>`, `<=`, `>=`), and negation (`-x`) operators work with `Float64` values.

## String Operators

Strings support concatenation with the `+` operator:

```rust
let greeting: String = "Hello, " + "world!"
println(greeting)

let name: String = "Kōdo"
let msg: String = "Welcome to " + name
println(msg)
```

Strings also support equality comparison with `==` and `!=`, which compares by content (not by pointer):

```rust
let a: String = "hello"
let b: String = "hello"
if a == b {
    println("strings are equal")
}
```

See [Modules and Imports](../modules-and-imports) for the full list of string methods (`length`, `contains`, `split`, `trim`, `concat`, `index_of`, `replace`, etc.).

## Next Steps

- [Closures](../closures) — closures, lambda lifting, and higher-order functions
- [Generics](../generics) — parameterize your types with type variables
- [Error Handling](../error-handling) — use `Option<T>` and `Result<T, E>` for safe error handling
- [Contracts](../contracts) — add runtime verification to your functions
