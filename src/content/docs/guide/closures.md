---
title: "Closures"
sidebar:
  order: 9
---

Kōdo supports closures (anonymous functions) that can capture variables from their enclosing scope. The compiler uses **lambda lifting** to transform closures into regular functions at compile time.

## Basic Closures

A closure is defined with `|params| { body }` syntax:

```rust
let double = |x: Int| -> Int { x * 2 }
```

## Passing Named Functions

Named functions can be passed where a function type is expected. This is the most reliable way to use higher-order functions:

```rust
fn square(x: Int) -> Int {
    return x * x
}

fn apply(f: (Int) -> Int, x: Int) -> Int {
    return f(x)
}

fn main() {
    let result: Int = apply(square, 4)
    print_int(result)  // 16
}
```

## Function Types

Function types use the `(ParamTypes) -> ReturnType` syntax:

```rust
fn double(x: Int) -> Int {
    return x * 2
}

fn apply_twice(f: (Int) -> Int, x: Int) -> Int {
    let once: Int = f(x)
    return f(once)
}

fn main() {
    let result: Int = apply_twice(double, 5)
    print_int(result)  // 20
}
```

## Closures with Built-in Methods

Closures work seamlessly with built-in list methods like `.map()`, `.filter()`, and `.fold()`:

```rust
fn main() {
    let nums: List<Int> = list_new()
    list_push(nums, 1)
    list_push(nums, 2)
    list_push(nums, 3)

    let doubled: List<Int> = nums.map(|x: Int| -> Int { x * 2 })
    let sum: Int = doubled.fold(0, |acc: Int, x: Int| -> Int { acc + x })
    print_int(sum)  // 12
}
```

Closures work with both built-in list methods (`.map()`, `.filter()`, `.fold()`) and custom higher-order functions. Both expression-body (`{ x * 2 }`) and return-body (`{ return x * 2 }`) closures are supported.

## How Lambda Lifting Works

Lambda lifting is a compiler technique that eliminates closures by converting them to regular functions:

1. **Capture analysis**: The compiler identifies free variables in the closure body
2. **Lifting**: The closure becomes a top-level function with captured variables as extra parameters
3. **Call site transformation**: Where the closure is created, the captured values are passed as arguments

This means closures have zero runtime overhead compared to regular function calls — there is no heap-allocated closure object.

## Complete Example

```rust
module closures_demo {
    meta {
        purpose: "Demonstrate closures and higher-order functions",
        version: "0.1.0"
    }

    fn double(x: Int) -> Int {
        return x * 2
    }

    fn increment(x: Int) -> Int {
        return x + 1
    }

    fn apply(f: (Int) -> Int, x: Int) -> Int {
        return f(x)
    }

    fn apply_twice(f: (Int) -> Int, x: Int) -> Int {
        let once: Int = f(x)
        return f(once)
    }

    fn main() {
        // Named function as argument
        let result: Int = apply(double, 5)
        print_int(result)  // 10

        // Apply twice
        let result2: Int = apply_twice(increment, 0)
        print_int(result2)  // 2

        // Closures with built-in methods
        let nums: List<Int> = list_new()
        list_push(nums, 4)
        print_int(apply(double, list_get(nums, 0)))  // 8
    }
}
```

## Closure Ownership Analysis

As of v0.4.0, the compiler performs **ownership analysis on closure captures**. Closures that capture variables from their enclosing scope are subject to the same ownership rules as regular code. The compiler tracks what each closure captures and enforces move/borrow rules on those captures.

### Capture After Move (E0281)

A closure cannot capture a variable that has already been moved:

```rust
fn main() {
    let data: String = "hello"
    let f1 = |x: Int| -> Int { println(data); return x }
    // data was captured (moved) by f1
    let f2 = |x: Int| -> Int { println(data); return x }
    // ERROR E0281: variable `data` was moved and cannot be captured by this closure
}
```

### Capture Moves Variable (E0282)

When a closure captures a non-Copy variable by move, that variable becomes unavailable in the enclosing scope:

```rust
fn main() {
    let data: String = "hello"
    let f = |x: Int| -> Int { println(data); return x }
    let result: String = data + " world"
    // ERROR E0282: closure captures `data` by move, making it unavailable after this point
}
```

### Double Capture (E0283)

Two closures in the same scope cannot both capture the same non-Copy variable:

```rust
fn main() {
    let data: String = "hello"
    let f1 = |x: Int| -> Int { println(data); return x }
    let f2 = |x: Int| -> Int { println(data); return x }
    // ERROR E0283: variable `data` cannot be captured by two closures
}
```

### Copy Types Are Fine

Primitive types (`Int`, `Bool`, `Float64`, `Byte`) are implicitly Copy and can be captured by any number of closures without restriction:

```rust
fn main() {
    let n: Int = 42
    let f1 = |x: Int| -> Int { return x + n }
    let f2 = |x: Int| -> Int { return x * n }
    // OK — Int is Copy, so n is not moved
}
```

## Next Steps

- [Generics](generics) — generic types and generic functions
- [Modules and Imports](modules-and-imports) — multi-file programs and the standard library
- [Data Types and Pattern Matching](data-types) — structs, enums, and `match`
