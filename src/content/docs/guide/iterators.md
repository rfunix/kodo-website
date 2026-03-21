---
title: "Iterators"
sidebar:
  order: 10
---

# Iterators

Kōdo provides a built-in iterator protocol that lets you traverse collections using `for-in` loops. Lists, Maps, and Strings all support iteration.

## The `for-in` Loop

The simplest way to iterate is with `for-in`:

```rust
let items: List<Int> = list_new()
list_push(items, 10)
list_push(items, 20)
list_push(items, 30)

for item in items {
    print_int(item)
}
```

Output:
```
10
20
30
```

## Iterating Over Lists

`for-in` on a `List<Int>` visits each element in order:

```rust
let items: List<Int> = list_new()
list_push(items, 10)
list_push(items, 20)
list_push(items, 30)

for item in items {
    print_int(item)
}
```

`for-in` works with both `List<Int>` and `List<String>`.

## Iterating Over Map Keys

`for-in` on a `Map<Int, Int>` iterates over the keys:

```rust
let scores: Map<Int, Int> = map_new()
map_insert(scores, 1, 95)
map_insert(scores, 2, 87)

for key in scores {
    print_int(key)
}
```

You can also use `map_contains_key` and `map_get` for direct lookups:

```rust
if map_contains_key(scores, 1) {
    print_int(map_get(scores, 1))
}
```

## Iterator Protocol

Under the hood, `for-in` desugars to the iterator protocol:

1. Call `.iter()` on the collection to get an iterator handle
2. Call `advance()` on the iterator — returns `1` if an element is available, `0` if exhausted
3. Call `value()` on the iterator to get the current element
4. Repeat until `advance()` returns `0`
5. Call `free()` on the iterator to clean up

You don't normally need to use the protocol directly — `for-in` handles it automatically.

## Custom Iterators

The `for-in` loop works with any type that implements the iterator protocol. Currently, `List<T>`, `Map<K, V>`, and `String` have built-in iterator support. Custom user-defined types do not yet support the `for-in` protocol — this requires trait-based iteration which is planned for a future release.

To iterate over custom data structures today, use index-based `while` loops or convert your data to a `List`.

## Range-Based Iteration

You can iterate over a range of integers using a `while` loop or by building a list:

```rust
let i: Int = 0
while i < 10 {
    print_int(i)
    i = i + 1
}
```

## List Higher-Order Methods

In addition to the iterator protocol used by `for-in`, `List<T>` provides direct higher-order methods that accept closures. These methods do not require `.iter()` — they are called directly on the list value.

### `list.map(fn)` — Transform Each Element

Applies a closure to each element and returns a new list with the results:

```rust
let numbers: List<Int> = [1, 2, 3, 4, 5]
let doubled: List<Int> = numbers.map(fn(x: Int) -> Int { return x * 2 })
// doubled contains [2, 4, 6, 8, 10]
```

### `list.filter(fn)` — Keep Matching Elements

Returns a new list containing only elements where the predicate returns `true`:

```rust
let numbers: List<Int> = [1, 2, 3, 4, 5]
let evens: List<Int> = numbers.filter(fn(x: Int) -> Bool { return x % 2 == 0 })
// evens contains [2, 4]
```

### `list.fold(init, fn)` — Reduce to a Single Value

Folds the list into a single value using an accumulator and a combining closure:

```rust
let numbers: List<Int> = [1, 2, 3, 4, 5]
let sum: Int = numbers.fold(0, fn(acc: Int, x: Int) -> Int { return acc + x })
// sum is 15
```

### `list.reduce(init, fn)` — Alias for fold

`reduce` behaves identically to `fold` — it takes an initial value and a combining closure:

```rust
let numbers: List<Int> = [1, 2, 3, 4, 5]
let product: Int = numbers.reduce(1, fn(acc: Int, x: Int) -> Int { return acc * x })
// product is 120
```

### `list.count(fn)` — Count Matching Elements

Returns the number of elements that satisfy the predicate:

```rust
let numbers: List<Int> = [1, 2, 3, 4, 5]
let even_count: Int = numbers.count(fn(x: Int) -> Bool { return x % 2 == 0 })
// even_count is 2
```

### `list.any(fn)` — Check If Any Element Matches

Returns `true` if at least one element satisfies the predicate:

```rust
let numbers: List<Int> = [1, 2, 3, 4, 5]
let has_big: Bool = numbers.any(fn(x: Int) -> Bool { return x > 3 })
// has_big is true
```

These methods complement the iterator-based combinators documented in [Functional Combinators](../functional). Use List methods when you want a concise, direct transformation without creating an explicit iterator.

## Examples

- [`for_in.ko`](https://github.com/rfunix/kodo/blob/main/examples/for_in.ko) — for-in loops over collections
- [`iterator_basic.ko`](https://github.com/rfunix/kodo/blob/main/examples/iterator_basic.ko) — basic iterator protocol
- [`iterator_list.ko`](https://github.com/rfunix/kodo/blob/main/examples/iterator_list.ko) — iterating over `List<T>`
- [`iterator_map_filter.ko`](https://github.com/rfunix/kodo/blob/main/examples/iterator_map_filter.ko) — `map` and `filter` on iterators
- [`iterator_fold.ko`](https://github.com/rfunix/kodo/blob/main/examples/iterator_fold.ko) — `fold` for aggregation
- [`iterator_map.ko`](https://github.com/rfunix/kodo/blob/main/examples/iterator_map.ko) — iterating over `Map` keys
- [`iterator_string.ko`](https://github.com/rfunix/kodo/blob/main/examples/iterator_string.ko) — iterating over `String` characters

## Next Steps

- [Functional Combinators](../functional) — `map`, `filter`, `fold`, and pipeline composition
- [Closures](../closures) — closures and higher-order functions
- [Data Types](../data-types) — structs, enums, and pattern matching
