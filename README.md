# japlan

JavaScript parser and serializer for APLAN (APL Array Notation).

Like Japan, but with an l.

## Installation

Copy `japlan.js` to your project. There's no npm install as it's a single file.

## Usage

```javascript
import { parse, serialize, _ns } from './japlan.js';

parse('(1 ⋄ 2 ⋄ 3)');        // → [1, 2, 3]
parse('[1 2 ⋄ 3 4]');        // → [[1, 2], [3, 4]] with _shape
parse('(x: 1 ⋄ y: 2)');      // → { x: 1, y: 2 } with _ns Symbol

serialize([1, 2, 3]);        // → "1 2 3"
serialize({ x: 1, y: 2 });   // → "(\n x: 1\n y: 2\n)"
```

See [demo.md](demo.md) for comprehensive examples.

## JavaScript Representation

### Numbers

| APLAN | JavaScript |
|-------|------------|
| `42` | `42` |
| `¯5` | `-5` |
| `3.14` | `3.14` |
| `1E5` | `100000` |
| `2.5E¯3` | `0.0025` |
| `3J4` | `{ re: 3, im: 4 }` |

### Vectors

One-dimensional arrays, as expected: `1 2 3` → `[1, 2, 3]`

### Matrices

Nested arrays with `_shape` property:

```javascript
const m = parse('[1 2 ⋄ 3 4]');
// m = [[1, 2], [3, 4]]
// m._shape = [2, 2]

m[0][1] = 99;           // modify
serialize(m);
// → "[
//     1 99
//     3 4
//    ]"
```

### Namespaces

Objects with `_ns` Symbol (hidden from `Object.keys()`):

```javascript
import { _ns } from './japlan.js';

const ns = parse('(x: 1 ⋄ y: 2)');
// ns = { x: 1, y: 2 }
// ns[_ns] = true

if (ns[_ns]) { /* it's a namespace */ }
```

### Zilde

Empty array with `_isZilde` property:

```javascript
import { zilde } from './japlan.js';

parse('⍬') === zilde    // true
zilde._isZilde          // true
```

## API

### `parse(source: string): any`

Parse APLAN string to JavaScript value.

### `serialize(value: any, options?): string`

Serialize JavaScript to APLAN.

Options:
- `useDiamond: boolean` — use `⋄` instead of newlines (default: `false`)

### `equal(a: any, b: any): boolean`

Deep equality for APLAN values.

### `get(value, index): any`

Index into arrays or matrices: `get(xs, idx)` or `get(matrix, [row, col])`

### Exports

`parse`, `serialize`, `equal`, `get`, `zilde`, `_ns`

## Testing

```bash
npm test
```

## References

- [APL Wiki: Array Notation](https://aplwiki.com/wiki/Array_notation)
- [Formal Proposal — APL Array Notation](https://abrudz.github.io/aplan/Formal%20Proposal%20%E2%80%94%20APL%20Array%20Notation.html)
- [Dyalog Documentation: Array Notation](https://docs.dyalog.com/20.0/programming-reference-guide/introduction/arrays/array-notation/)
- [Dyalog Blog: ECOOP 2025 - APL Array Notation](https://www.dyalog.com/blog/2025/07/ecoop-2025-presenting-apl-standards-and-array-notation/)

## License

MIT
