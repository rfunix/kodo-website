---
title: Regex Builtins
---

# Regex Builtins

Kōdo provides three built-in functions for regular expression matching and manipulation.
They are available in every program without any import.

All three use RE2-compatible syntax (no backtracking, no lookahead/lookbehind).
Invalid patterns never cause a runtime panic — they return a safe default value instead.

## `regex_match`

```
fn regex_match(pattern: String, text: String) -> Bool
```

Returns `true` if `pattern` matches anywhere in `text`, `false` otherwise.
An invalid pattern always returns `false`.

```kodo
let has_digits: Bool = regex_match("\\d+", "abc123")
// true

let anchored: Bool = regex_match("^hello", "hello world")
// true — matches at the start
```

## `regex_find`

```
fn regex_find(pattern: String, text: String) -> Option<String>
```

Returns `Some(first_match)` with the first matched substring, or `None` when
there is no match or the pattern is invalid.

```kodo
let first: Option<String> = regex_find("\\w+", "hello world")
if first.is_some() {
    let word: String = first.unwrap()
    println(word)  // "hello"
}

let none: Option<String> = regex_find("\\d+", "no digits here")
if none.is_none() {
    println("no match found")
}
```

## `regex_replace`

```
fn regex_replace(pattern: String, text: String, replacement: String) -> String
```

Replaces **all** non-overlapping matches of `pattern` in `text` with `replacement`.
Returns the original `text` unchanged if the pattern is invalid.

**Note**: the argument order is `(pattern, text, replacement)` — pattern first, then
the text to search, then the replacement string.

```kodo
let result: String = regex_replace("o", "hello world", "0")
println(result)  // "hell0 w0rld"

let cleaned: String = regex_replace("\\s+", "  too   many   spaces  ", " ")
println(cleaned)  // " too many spaces "
```

## Pattern Syntax

Kōdo uses RE2-compatible syntax. Common patterns:

| Pattern | Matches |
|---------|---------|
| `\\d` | Digit (0–9) |
| `\\w` | Word character (a-z, A-Z, 0-9, _) |
| `\\s` | Whitespace |
| `\\D`, `\\W`, `\\S` | Negated versions of the above |
| `.` | Any character except newline |
| `^`, `$` | Start/end of string |
| `[abc]` | Character class |
| `[^abc]` | Negated character class |
| `a+`, `a*`, `a?` | Quantifiers |
| `(a\|b)` | Alternation |

Lookahead, lookbehind, and backreferences are **not supported** (RE2 constraint).

## Error Handling

Invalid patterns never panic — they return a safe fallback:

| Builtin | Invalid pattern returns |
|---------|------------------------|
| `regex_match` | `false` |
| `regex_find` | `None` |
| `regex_replace` | original `text` unchanged |

## Common Use Cases

### Validate an email address (simple heuristic)

```kodo
let is_email: Bool = regex_match("[^@]+@[^@]+\\.[^@]+", user_input)
```

### Extract the first number from a string

```kodo
let num: Option<String> = regex_find("\\d+", "The answer is 42")
// Some("42")
```

### Sanitise a URL slug

```kodo
let slug: String = regex_replace("[^a-z0-9]+", to_lower(title), "-")
```

## Full Example

```kodo
module regex_demo {
    meta {
        purpose: "Demonstrate regex builtins"
        version: "1.0.0"
    }

    fn main() -> Int {
        // regex_match: check if pattern occurs in text
        let matched: Bool = regex_match("\\d+", "abc123")
        if matched {
            println("found digits")
        }

        // regex_find: get the first occurrence
        let found: Option<String> = regex_find("\\w+", "hello world")
        if found.is_some() {
            let word: String = found.unwrap()
            println(word)
            // prints: hello
        }

        // regex_replace: replace all occurrences
        let replaced: String = regex_replace("o", "hello world", "0")
        println(replaced)
        // prints: hell0 w0rld

        return 0
    }
}
```

See also the runnable [`examples/regex_demo.ko`](https://github.com/kodo-lang/kodo/blob/main/examples/regex_demo.ko)
in the repository.
