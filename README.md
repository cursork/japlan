# japlan

A JavaScript parser and serializer for **APLAN** (APL Array Notation) — the literal array syntax for Dyalog APL 20.0+.

## What is APLAN?

APLAN (APL Array Notation) is a text-based format for representing APL arrays, introduced in Dyalog APL version 20.0. It allows writing nested arrays, matrices, and namespaces as literals without requiring primitive functions.

Key features:
- **Human-readable** serialization of APL data structures
- **Round-trip** capability: parse → serialize → parse yields identical results
- **Supports** scalars, vectors, matrices, nested arrays, and namespaces
- **File extension**: `.apla`

## Installation

```bash
# Clone or copy aplan.js to your project
npm install  # No dependencies required
```

## Quick Start

```javascript
import { parse, serialize } from './aplan.js';

// Parse APLAN to JavaScript
const vector = parse('(1 ⋄ 2 ⋄ 3)');
// → [1, 2, 3]

const matrix = parse('[1 2 ⋄ 3 4]');
// → { __aplan_matrix__: true, shape: [2, 2], data: [1, 2, 3, 4] }

const namespace = parse('(x: 42 ⋄ y: 100)');
// → { __aplan_ns__: true, x: 42, y: 100 }

// Serialize JavaScript to APLAN
serialize([1, 2, 3]);
// → "1 2 3"

serialize({ x: 1, y: 2 });
// → "(x: 1 ⋄ y: 2)"
```

## APLAN Syntax Reference

### Separators

APLAN uses **separators** to distinguish array notation from regular APL grouping:

| Separator | Description |
|-----------|-------------|
| `⋄` | Diamond (statement separator) |
| `\n` | Line feed (newline) |
| `\r` | Carriage return |
| `\x85` | NEL (Next Line) |

**Rule**: At least one separator is required inside parentheses or brackets to indicate array notation (rather than traditional grouping).

```apl
(42)        ⍝ Just grouping, returns scalar 42
(42 ⋄)      ⍝ Array notation, returns 1-element vector
(1 ⋄ 2 ⋄ 3) ⍝ Array notation, returns 3-element vector
```

### Numbers

APLAN supports all Dyalog APL number formats:

| Format | Example | JavaScript Result |
|--------|---------|-------------------|
| Integer | `42` | `42` |
| Negative | `¯5` | `-5` |
| Float | `3.14` | `3.14` |
| Exponential | `1E5` | `100000` |
| Negative exponent | `2.5E¯3` | `0.0025` |
| Complex | `3J4` | `{ re: 3, im: 4 }` |
| Complex negative | `¯2J¯3` | `{ re: -2, im: -3 }` |

**Important**: APL uses high minus `¯` (U+00AF) for negative numbers, not the regular minus `-`.

```javascript
parse('¯42')      // → -42
parse('1E¯6')     // → 0.000001
parse('3J4')      // → { re: 3, im: 4 }
```

#### Number Strands

Multiple numbers separated by spaces form a vector (strand notation):

```javascript
parse('1 2 3')      // → [1, 2, 3]
parse('¯1 0 1')     // → [-1, 0, 1]
parse('1.5 2.5 3.5') // → [1.5, 2.5, 3.5]
```

### Strings

Strings use **single quotes** with doubled quotes for escaping:

```javascript
parse("'hello'")        // → "hello"
parse("''")             // → "" (empty string)
parse("'it''s'")        // → "it's"
parse("'say ''hi'''")   // → "say 'hi'"
```

String strands work like number strands:

```javascript
parse("'a' 'b' 'c'")    // → ["a", "b", "c"]
```

### Zilde (Empty Vector)

The symbol `⍬` represents an empty numeric vector:

```javascript
parse('⍬')    // → []
```

### Vectors (Parentheses)

Parentheses with separators create vectors:

```apl
(1 ⋄ 2 ⋄ 3)           ⍝ Vector of numbers
('a' ⋄ 'b' ⋄ 'c')     ⍝ Vector of strings
(1 ⋄ 'two' ⋄ 3)       ⍝ Mixed vector
((1 ⋄ 2) ⋄ (3 ⋄ 4))   ⍝ Nested vector
```

**With newlines** (equivalent to diamonds):

```apl
(
  'first'
  'second'
  'third'
)
```

**Single-element vectors** require a separator:

```javascript
parse('(42 ⋄)')   // → [42] (trailing separator)
parse('(⋄ 42)')   // → [42] (leading separator)
parse('(42)')     // → 42   (just grouping, returns scalar)
```

**Strands within vectors**:

```javascript
parse('(1 2 ⋄ 3 4)')    // → [[1, 2], [3, 4]]
parse('(1 2 ⋄ 3 4 5)')  // → [[1, 2], [3, 4, 5]]
```

### Matrices (Square Brackets)

Square brackets with separators create matrices where each separated element becomes a **major cell** (row):

```apl
[1 2 ⋄ 3 4]           ⍝ 2×2 matrix
[1 2 3 ⋄ 4 5 6]       ⍝ 2×3 matrix
[1 ⋄ 2 ⋄ 3]           ⍝ 3×1 column matrix
```

```javascript
parse('[1 2 ⋄ 3 4]')
// → { __aplan_matrix__: true, shape: [2, 2], data: [1, 2, 3, 4] }

parse('[1 ⋄ 2 ⋄ 3]')
// → { __aplan_matrix__: true, shape: [3, 1], data: [1, 2, 3] }
```

**Automatic padding**: Rows with different lengths are padded with zeros:

```javascript
parse('[1 2 ⋄ 3 4 5]')
// → { shape: [2, 3], data: [1, 2, 0, 3, 4, 5] }
// First row padded: [1, 2, 0]
```

**Scalar coercion**: In brackets, scalars become 1-element vectors:

```apl
[1 ⋄ 2]   ⍝ Equivalent to ⍪1 2 (column matrix)
```

### Namespaces

Parentheses with `name: value` pairs create namespaces:

```apl
()                          ⍝ Empty namespace
(x: 42)                     ⍝ Single member
(x: 1 ⋄ y: 2)               ⍝ Multiple members
(name: 'John' ⋄ age: 30)    ⍝ Mixed types
(data: (1 ⋄ 2 ⋄ 3))         ⍝ Nested array value
(outer: (inner: 42))        ⍝ Nested namespace
```

```javascript
parse('(x: 1 ⋄ y: 2)')
// → { __aplan_ns__: true, x: 1, y: 2 }

parse('()')
// → { __aplan_ns__: true }
```

**Valid names**: APL identifiers (letters, digits, `∆`, `⍙`, starting with letter/underscore).

## JavaScript Representation

### Scalars

| APLAN | JavaScript |
|-------|------------|
| `42` | `42` |
| `3.14` | `3.14` |
| `'hello'` | `"hello"` |
| `3J4` | `{ re: 3, im: 4 }` |

### Vectors

Simple arrays:

```javascript
parse('(1 ⋄ 2 ⋄ 3)')  // → [1, 2, 3]
```

### Matrices

Objects with shape and flattened data:

```javascript
parse('[1 2 ⋄ 3 4]')
// → {
//     __aplan_matrix__: true,
//     shape: [2, 2],
//     data: [1, 2, 3, 4]
// }
```

To access element at row `r`, column `c`:
```javascript
const m = parse('[1 2 3 ⋄ 4 5 6]');
const cols = m.shape[1];
const element = m.data[r * cols + c];
```

### Namespaces

Objects with marker property:

```javascript
parse('(x: 1 ⋄ y: 2)')
// → {
//     __aplan_ns__: true,
//     x: 1,
//     y: 2
// }
```

## API Reference

### `parse(source: string): any`

Parse an APLAN string into a JavaScript value.

```javascript
parse('42')                    // → 42
parse("'hello'")               // → "hello"
parse('(1 ⋄ 2 ⋄ 3)')           // → [1, 2, 3]
parse('[1 2 ⋄ 3 4]')           // → { __aplan_matrix__: true, ... }
parse('(x: 1)')                // → { __aplan_ns__: true, x: 1 }
```

### `serialize(value: any, options?: object): string`

Serialize a JavaScript value to APLAN.

**Options:**
- `useDiamond: boolean` — Use `⋄` instead of newlines (default: `false`)
- `indent: number` — Spaces for indentation (default: `1`)

```javascript
serialize(42)                  // → "42"
serialize(-5)                  // → "¯5"
serialize("hello")             // → "'hello'"
serialize([1, 2, 3])           // → "1 2 3"
serialize([1, 'two', 3])       // → "(\n 1\n 'two'\n 3\n)"
serialize([1, 'two'], { useDiamond: true })  // → "(1 ⋄ 'two')"
```

### `equal(a: any, b: any): boolean`

Deep equality check for APLAN values (useful for round-trip testing).

```javascript
equal([1, 2, 3], [1, 2, 3])    // → true
equal({ re: 3, im: 4 }, { re: 3, im: 4 })  // → true
```

## Real-World Examples

### Configuration Table (from EWC)

```apl
[
 0   'All'
 1   'MouseDown'
 2   'MouseUp'
 3   'MouseMove'
]
```

```javascript
const events = parse(source);
// events.shape → [4, 2]
// events.data → [0, 'All', 1, 'MouseDown', 2, 'MouseUp', 3, 'MouseMove']
```

### Nested Structure (Grid Defaults)

```apl
(
 'Grid'
 0
 112 137
 (
  'None'
  'None'
 )
)
```

```javascript
const config = parse(source);
// config[0] → 'Grid'
// config[1] → 0
// config[2] → [112, 137]
// config[3] → ['None', 'None']
```

### Data Table

```apl
[
 'USERS'      'Users.csv'
 'MEMBERS'    'Members.csv'
 'WORK'       'Worklists.csv'
]
```

```javascript
const tables = parse(source);
// tables.shape → [3, 2]
// tables.data → ['USERS', 'Users.csv', 'MEMBERS', 'Members.csv', ...]
```

## Formal Grammar

Based on the [official APLAN specification](https://abrudz.github.io/aplan/Formal%20Proposal%20%E2%80%94%20APL%20Array%20Notation.html):

```ebnf
value ::= expression | list | block | space
list  ::= '(' ( ( value sep )+ value? | ( sep value )+ sep? ) ')'
block ::= '[' ( ( value sep )+ value? | ( sep value )+ sep? ) ']'
space ::= '(' sep? ( name ':' value ( sep name ':' value )* )? sep? ')'
sep   ::= [⋄\n\r\x85]+
```

Where:
- `expression` is any valid APL expression (numbers, strings, strands)
- `sep` is one or more separator characters
- `name` is a valid APL identifier

## Limitations

This implementation focuses on **data serialization**. It does not support:

- APL expressions with primitives (e.g., `0⌿[⍬]`)
- Function definitions in namespaces
- Traditional functions (tradfns)
- System variables in namespaces

For full APL expression evaluation, use Dyalog APL's `⎕SE.Dyalog.Array.Deserialise`.

## Testing

```bash
npm test
# Runs 69 tests covering parsing, serialization, and round-trips
```

## References

- [APL Wiki: Array Notation](https://aplwiki.com/wiki/Array_notation)
- [Formal Proposal — APL Array Notation](https://abrudz.github.io/aplan/Formal%20Proposal%20%E2%80%94%20APL%20Array%20Notation.html)
- [Dyalog Documentation: Array Notation](https://docs.dyalog.com/20.0/programming-reference-guide/introduction/arrays/array-notation/)
- [APL Wiki: High Minus](https://aplwiki.com/wiki/High_minus)
- [Dyalog Blog: ECOOP 2025 - APL Array Notation](https://www.dyalog.com/blog/2025/07/ecoop-2025-presenting-apl-standards-and-array-notation/)

## License

MIT
