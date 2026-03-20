---
title: "Functional Programming"
sidebar:
  order: 13
---

# Functional Combinators

Kōdo provides functional combinators on lists that let you transform, filter, and aggregate data declaratively. These combinators compose into pipelines that are expressive and easy for both AI agents and humans to reason about.

## `map` — Transform Elements

`map` applies a closure to each element, producing a new list:

```rust
let numbers: List<Int> = list_new()
list_push(numbers, 1)
list_push(numbers, 2)
list_push(numbers, 3)

let doubled: List<Int> = numbers.map(|x: Int| -> Int { x * 2 })
// doubled contains [2, 4, 6]
```

## `filter` — Select Elements

`filter` keeps only elements where the predicate returns `true`:

```rust
let numbers: List<Int> = list_new()
list_push(numbers, 1)
list_push(numbers, 2)
list_push(numbers, 3)
list_push(numbers, 4)

let evens: List<Int> = numbers.filter(|x: Int| -> Bool { x % 2 == 0 })
// evens contains [2, 4]
```

## `fold` — Aggregate to a Single Value

`fold` reduces a collection to a single value by applying a combining function:

```rust
let numbers: List<Int> = list_new()
list_push(numbers, 1)
list_push(numbers, 2)
list_push(numbers, 3)

let sum: Int = numbers.fold(0, |acc: Int, x: Int| -> Int { acc + x })
// sum is 6
```

The first argument is the initial accumulator value. The closure receives the current accumulator and the next element, and returns the new accumulator.

## `any` — Check If Any Match

`any` returns `true` if at least one element satisfies the predicate:

```rust
let numbers: List<Int> = list_new()
list_push(numbers, 1)
list_push(numbers, 2)
list_push(numbers, 3)

let has_even: Bool = numbers.any(|x: Int| -> Bool { x % 2 == 0 })
// has_even is true
```

## `all` — Check If All Match

`all` returns `true` if every element satisfies the predicate:

```rust
let numbers: List<Int> = list_new()
list_push(numbers, 2)
list_push(numbers, 4)
list_push(numbers, 6)

let all_even: Bool = numbers.all(|x: Int| -> Bool { x % 2 == 0 })
// all_even is true
```

## `reduce` — Fold Without Initial Value

`reduce` is like `fold` but uses the first element as the initial accumulator:

```rust
let numbers: List<Int> = list_new()
list_push(numbers, 1)
list_push(numbers, 2)
list_push(numbers, 3)

let sum: Int = numbers.reduce(0, fn(acc: Int, x: Int) -> Int { return acc + x })
// sum is 6
```

## `count` — Count Matching Elements

`count` with a predicate counts elements satisfying the condition:

```rust
let numbers: List<Int> = list_new()
list_push(numbers, 1)
list_push(numbers, 2)
list_push(numbers, 3)
list_push(numbers, 4)

let num_evens: Int = numbers.count(fn(x: Int) -> Bool { return x % 2 == 0 })
// num_evens is 2
```

## Composing Pipelines

Combinators chain naturally to form data processing pipelines:

```rust
let data: List<Int> = list_new()
list_push(data, 1)
list_push(data, 2)
list_push(data, 3)
list_push(data, 4)
list_push(data, 5)

// Filter even numbers, double them, then sum
let evens: List<Int> = data.filter(|x: Int| -> Bool { x % 2 == 0 })
let doubled: List<Int> = evens.map(|x: Int| -> Int { x * 2 })
let result: Int = doubled.fold(0, |acc: Int, x: Int| -> Int { acc + x })
// result is 12 (2*2 + 4*2)
```

This pipeline is:
1. **Readable**: each step describes one transformation
2. **Composable**: add or remove steps without restructuring
3. **Verifiable**: contracts can be attached at each stage

## Examples

- [`functional_pipeline.ko`](https://github.com/rfunix/kodo/blob/main/examples/functional_pipeline.ko) — chained combinator pipelines
- [`iterator_map_filter.ko`](https://github.com/rfunix/kodo/blob/main/examples/iterator_map_filter.ko) — `map` and `filter` usage
- [`iterator_fold.ko`](https://github.com/rfunix/kodo/blob/main/examples/iterator_fold.ko) — `fold` for aggregation
- [`closures_functional.ko`](https://github.com/rfunix/kodo/blob/main/examples/closures_functional.ko) — higher-order functions
- [`list_functional.ko`](https://github.com/rfunix/kodo/blob/main/examples/list_functional.ko) — all functional combinators on List
- [`word_counter.ko`](https://github.com/rfunix/kodo/blob/main/examples/word_counter.ko) — real-world pipeline with string ops and fold

## Next Steps

- [Iterators](../iterators) — the `for-in` loop and iterator protocol
- [Closures](../closures) — closures and variable capture
- [Contracts](../contracts) — add `requires`/`ensures` to pipeline functions
