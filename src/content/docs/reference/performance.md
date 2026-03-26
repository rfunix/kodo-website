---
title: "Runtime & Compiler Performance"
sidebar:
  order: 5
---

# Runtime & Compiler Performance Benchmarks

> Measured on Apple M3 Pro, macOS 15.5, Kōdo v1.8.0.
> Each test run 3 times, best time reported. All times in seconds.

## Runtime Performance

### Recursive Fibonacci — fib(35)

Pure recursive computation, no I/O. Tests function call overhead and recursion.

| Language | Time (s) | Relative |
|----------|-------:|------:|
| **Kōdo** (Inkwell LLVM) | 0.029 | 0.7x |
| **Kōdo** (Cranelift) | 0.035 | 0.9x |
| **Rust** (release) | 0.04 | 1.0x |
| **Node.js** (V8 JIT) | 0.09 | 2.3x |
| **Go** | 0.09 | 2.3x |
| **Python** | 0.87 | 21.8x |

Kōdo Inkwell is **faster than Rust** on recursive workloads. This is possible
because Kōdo's concurrency-aware yield analysis skips overhead for pure
functions, and LLVM's optimization passes handle recursion efficiently.

Kōdo is **25-30x faster than Python** on recursive computation.

### Sum Loop — 10 million iterations

Tight loop with integer addition. Tests loop overhead and basic arithmetic.

| Language | Time (s) | Relative |
|----------|-------:|------:|
| **Rust** (release) | 0.00 | 1.0x |
| **Kōdo** (Inkwell LLVM) | 0.020 | — |
| **Kōdo** (Cranelift) | 0.022 | — |
| **Node.js** (V8 JIT) | 0.06 | — |
| **Go** | 0.08 | — |
| **Python** | 0.48 | — |

Kōdo is **4x faster than Go** and **24x faster than Python** on tight loops.

## Backend Comparison — Cranelift vs Inkwell (LLVM)

Kōdo supports two code generation backends:

- **Cranelift** — default, fast compilation, good runtime performance
- **Inkwell (LLVM C API)** — uses the full LLVM optimization pipeline with
  alloca elimination, function inlining hints, and native CPU targeting

| Benchmark | Cranelift | Inkwell LLVM | Difference |
|-----------|----------|---------|-------------|
| fib(35) | 0.035s | **0.029s** | **17% faster** |
| sum 10M | 0.022s | **0.020s** | **9% faster** |

Inkwell consistently outperforms Cranelift thanks to LLVM's more aggressive
optimization passes, including better register allocation, loop optimization,
and function inlining.

123 of 142 examples compile and run correctly with the Inkwell backend.
All 142 examples work with the default Cranelift backend.

**Build**: `cargo build -p kodoc --features llvm`
**Use**: `kodoc build file.ko --backend=inkwell`
**Release mode**: `kodoc build file.ko --release` (requires LLVM feature)

## Concurrency-Aware Yield Optimization

Kōdo's green thread scheduler inserts yield points for cooperative multitasking.
An inter-procedural analysis detects which functions participate in concurrency
(spawn, channels, async) and **skips yield insertion for pure functions**.

This eliminates massive overhead in recursive and loop-heavy code:

| Benchmark | Before optimization | After | Speedup |
|-----------|-------------------|-------|---------|
| fib(35) Cranelift | 0.25s | **0.035s** | **7.1x** |
| sum 10M Cranelift | 0.078s | **0.022s** | **3.5x** |
| fib(35) Inkwell | 0.25s | **0.029s** | **8.6x** |

Functions that use `spawn`, `channel_*`, or `async` continue to receive yield
points normally, ensuring cooperative scheduling works correctly.

## Compiler Performance

### Compilation Speed

How fast the Kōdo compiler processes source code.

| Operation | File | Lines | Time |
|-----------|------|------:|-----:|
| `kodoc check` | self_hosted_parser.ko | 1,897 | **7ms** |
| `kodoc check` | fibonacci.ko | 30 | **4ms** |
| `kodoc build` | fibonacci.ko | 30 | **105ms** |
| `kodoc build` | hello.ko | 12 | **105ms** |
| `kodoc build` | contracts_demo.ko | 45 | **105ms** |

### Comparison: Compilation Speed

| Compiler | File | Time | Notes |
|----------|------|-----:|-------|
| **kodoc check** | 1,897 lines | 7ms | Type checking only |
| **kodoc build** | small file | 105ms | Full pipeline + linking |
| **rustc** | small file | 68ms | Single file, no deps |
| **rustc -O** | small file | 68ms | With optimizations |
| **go build** | small file | 194ms | Single file |

Kōdo's type checker is extremely fast (7ms for ~2K lines). The `build` time is
dominated by the linker (`clang`), not the compiler itself. For the agent
feedback loop (`check` → fix → recheck), Kōdo delivers sub-10ms latency.

### Throughput

| Metric | Value |
|--------|------:|
| Check throughput | ~270K lines/sec |
| Build throughput | ~300 lines/sec (linker-bound) |
| WASM playground check | < 50ms (browser) |

## Key Takeaways

1. **Kōdo Inkwell is faster than Rust** on recursive workloads
2. **4x faster than Go** on tight loops
3. **24-30x faster than Python** across all benchmarks
4. **Compiler check is sub-10ms** — instant feedback for agents
5. **Full build is ~100ms** — fast enough for tight compile-fix loops
6. **Concurrency-aware optimization** eliminates yield overhead in pure code

## Methodology

- Cranelift is the default backend (`kodoc build`)
- Inkwell results use `kodoc build --backend=inkwell` with `--features llvm`
- Release mode uses `kodoc build --release` (Inkwell with O3)
- Rust uses `rustc -O` (release optimizations)
- Go uses `go build` (default optimizations)
- Node.js uses V8's JIT compiler
- Python uses CPython 3.12
- No warmup runs; cold-start measurement for compilation
- Runtime benchmarks exclude compilation time
