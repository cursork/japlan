# APLAN Parser Demo

JavaScript Parser for Dyalog APL Array Notation

This is not a demo for learning - more to test that all features work...


---

## NUMBERS


### Integer

```apl
42
```

**Parsed:**
```javascript
42
```

**Output:**
```apl
42
```

### Zero

```apl
0
```

**Parsed:**
```javascript
0
```

**Output:**
```apl
0
```

### Negative (high minus ¯)

```apl
¯5
```

**Parsed:**
```javascript
-5
```

**Output:**
```apl
¯5
```

### Float

```apl
3.14
```

**Parsed:**
```javascript
3.14
```

**Output:**
```apl
3.14
```

### Negative float

```apl
¯2.5
```

**Parsed:**
```javascript
-2.5
```

**Output:**
```apl
¯2.5
```

### Exponential notation

```apl
1E5
```

**Parsed:**
```javascript
100000
```

**Output:**
```apl
100000
```

### Negative exponent

```apl
2.5E¯3
```

**Parsed:**
```javascript
0.0025
```

**Output:**
```apl
0.0025
```

### Very small number

```apl
1E¯10
```

**Parsed:**
```javascript
1e-10
```

**Output:**
```apl
1E¯10
```

### Very large number

```apl
1E10
```

**Parsed:**
```javascript
10000000000
```

**Output:**
```apl
10000000000
```

### Complex number (J notation)

```apl
3J4
```

**Parsed:**
```javascript
{
  "re": 3,
  "im": 4
}
```

**Output:**
```apl
3J4
```

### Complex with negatives

```apl
¯2J¯3
```

**Parsed:**
```javascript
{
  "re": -2,
  "im": -3
}
```

**Output:**
```apl
¯2J¯3
```

### Complex with exponential

```apl
1E2J3E1
```

**Parsed:**
```javascript
{
  "re": 100,
  "im": 30
}
```

**Output:**
```apl
100J30
```

---

## NUMBER STRANDS (vectors without parens)


### Simple strand

```apl
1 2 3
```

**Parsed:**
```javascript
[
  1,
  2,
  3
]
```

**Output:**
```apl
1 2 3
```

### Negative numbers

```apl
¯1 0 1
```

**Parsed:**
```javascript
[
  -1,
  0,
  1
]
```

**Output:**
```apl
¯1 0 1
```

### Mixed integers and floats

```apl
1 2.5 3
```

**Parsed:**
```javascript
[
  1,
  2.5,
  3
]
```

**Output:**
```apl
1 2.5 3
```

---

## STRINGS


### Simple string

```apl
'hello'
```

**Parsed:**
```javascript
"hello"
```

**Output:**
```apl
'hello'
```

### Empty string

```apl
''
```

**Parsed:**
```javascript
""
```

**Output:**
```apl
''
```

### String with spaces

```apl
'hello world'
```

**Parsed:**
```javascript
"hello world"
```

**Output:**
```apl
'hello world'
```

### Escaped quote (doubled)

```apl
'it''s'
```

**Parsed:**
```javascript
"it's"
```

**Output:**
```apl
'it''s'
```

### Multiple escaped quotes

```apl
'say ''hello'''
```

**Parsed:**
```javascript
"say 'hello'"
```

**Output:**
```apl
'say ''hello'''
```

### String strand

```apl
'a' 'b' 'c'
```

**Parsed:**
```javascript
[
  "a",
  "b",
  "c"
]
```

**Output:**
```apl
('a' ⋄ 'b' ⋄ 'c')
```

---

## ZILDE (empty numeric vector)


### Zilde symbol ⍬

```apl
⍬
```

**Parsed:**
```javascript
[]
```

**Output:**
```apl
⍬
```

---

## VECTORS (parentheses with separators)


### Vector with diamonds

```apl
(1 ⋄ 2 ⋄ 3)
```

**Parsed:**
```javascript
[
  1,
  2,
  3
]
```

**Output:**
```apl
1 2 3
```

### Vector with newlines

```apl
(1
2
3)
```

**Parsed:**
```javascript
[
  1,
  2,
  3
]
```

**Output:**
```apl
1 2 3
```

### Mixed types

```apl
(1 ⋄ 'two' ⋄ 3)
```

**Parsed:**
```javascript
[
  1,
  "two",
  3
]
```

**Output:**
```apl
(1 ⋄ 'two' ⋄ 3)
```

### Nested vectors

```apl
((1 ⋄ 2) ⋄ (3 ⋄ 4))
```

**Parsed:**
```javascript
[
  [
    1,
    2
  ],
  [
    3,
    4
  ]
]
```

**Output:**
```apl
(1 2 ⋄ 3 4)
```

### Single element (trailing sep)

```apl
(42 ⋄)
```

**Parsed:**
```javascript
[
  42
]
```

**Output:**
```apl
42
```

### Single element (leading sep)

```apl
(⋄ 42)
```

**Parsed:**
```javascript
[
  42
]
```

**Output:**
```apl
42
```

### Grouping only (no sep) = scalar

```apl
(42)
```

**Parsed:**
```javascript
42
```

**Output:**
```apl
42
```

### Vector of strings

```apl
('a' ⋄ 'b' ⋄ 'c')
```

**Parsed:**
```javascript
[
  "a",
  "b",
  "c"
]
```

**Output:**
```apl
('a' ⋄ 'b' ⋄ 'c')
```

### Strands in vector

```apl
(1 2 ⋄ 3 4)
```

**Parsed:**
```javascript
[
  [
    1,
    2
  ],
  [
    3,
    4
  ]
]
```

**Output:**
```apl
(1 2 ⋄ 3 4)
```

### Strands different lengths

```apl
(1 2 ⋄ 3 4 5)
```

**Parsed:**
```javascript
[
  [
    1,
    2
  ],
  [
    3,
    4,
    5
  ]
]
```

**Output:**
```apl
(1 2 ⋄ 3 4 5)
```

### Deeply nested

```apl
(((1 ⋄ 2) ⋄ (3 ⋄ 4)) ⋄ ((5 ⋄ 6) ⋄ (7 ⋄ 8)))
```

**Parsed:**
```javascript
[
  [
    [
      1,
      2
    ],
    [
      3,
      4
    ]
  ],
  [
    [
      5,
      6
    ],
    [
      7,
      8
    ]
  ]
]
```

**Output:**
```apl
((1 2 ⋄ 3 4) ⋄ (5 6 ⋄ 7 8))
```

### Multiple separators ignored

```apl
(1 ⋄ ⋄ 2)
```

**Parsed:**
```javascript
[
  1,
  2
]
```

**Output:**
```apl
1 2
```

### Trailing separator

```apl
(1 ⋄ 2 ⋄)
```

**Parsed:**
```javascript
[
  1,
  2
]
```

**Output:**
```apl
1 2
```

---

## MATRICES (square brackets)


### 2×2 matrix

```apl
[1 2 ⋄ 3 4]
```

**Parsed:**
```javascript
[
  [
    1,
    2
  ],
  [
    3,
    4
  ]
]
```

**Output:**
```apl
[1 2 ⋄ 3 4]
```

### 2×3 matrix

```apl
[1 2 3 ⋄ 4 5 6]
```

**Parsed:**
```javascript
[
  [
    1,
    2,
    3
  ],
  [
    4,
    5,
    6
  ]
]
```

**Output:**
```apl
[1 2 3 ⋄ 4 5 6]
```

### 3×1 column matrix

```apl
[1 ⋄ 2 ⋄ 3]
```

**Parsed:**
```javascript
[
  [
    1
  ],
  [
    2
  ],
  [
    3
  ]
]
```

**Output:**
```apl
[1 ⋄ 2 ⋄ 3]
```

### Padding shorter rows

```apl
[1 2 ⋄ 3 4 5]
```

**Parsed:**
```javascript
[
  [
    1,
    2,
    0
  ],
  [
    3,
    4,
    5
  ]
]
```

**Output:**
```apl
[1 2 0 ⋄ 3 4 5]
```

### String matrix

```apl
['a' 'b' ⋄ 'c' 'd']
```

**Parsed:**
```javascript
[
  [
    "a",
    "b"
  ],
  [
    "c",
    "d"
  ]
]
```

**Output:**
```apl
['a' 'b' ⋄ 'c' 'd']
```

### Empty brackets

```apl
[]
```

**Parsed:**
```javascript
[]
```

**Output:**
```apl
[]
```

### Matrix with newlines

```apl
[
 1 2 3
 4 5 6
 7 8 9
]
```

**Parsed:**
```javascript
[
  [
    1,
    2,
    3
  ],
  [
    4,
    5,
    6
  ],
  [
    7,
    8,
    9
  ]
]
```

**Output:**
```apl
[1 2 3 ⋄ 4 5 6 ⋄ 7 8 9]
```

---

## NAMESPACES (name: value pairs)


### Empty namespace

```apl
()
```

**Parsed:**
```javascript
{}
```

**Output:**
```apl
()
```

### Single member

```apl
(x: 42)
```

**Parsed:**
```javascript
{
  "x": 42
}
```

**Output:**
```apl
(x: 42)
```

### Multiple members

```apl
(x: 1 ⋄ y: 2)
```

**Parsed:**
```javascript
{
  "x": 1,
  "y": 2
}
```

**Output:**
```apl
(x: 1 ⋄ y: 2)
```

### String value

```apl
(name: 'John')
```

**Parsed:**
```javascript
{
  "name": "John"
}
```

**Output:**
```apl
(name: 'John')
```

### Array value

```apl
(data: (1 ⋄ 2 ⋄ 3))
```

**Parsed:**
```javascript
{
  "data": [
    1,
    2,
    3
  ]
}
```

**Output:**
```apl
(data: 1 2 3)
```

### Matrix value

```apl
(grid: [1 2 ⋄ 3 4])
```

**Parsed:**
```javascript
{
  "grid": [
    [
      1,
      2
    ],
    [
      3,
      4
    ]
  ]
}
```

**Output:**
```apl
(grid: [1 2 ⋄ 3 4])
```

### Nested namespace

```apl
(outer: (inner: 42))
```

**Parsed:**
```javascript
{
  "outer": {
    "inner": 42
  }
}
```

**Output:**
```apl
(outer: (inner: 42))
```

### Mixed types

```apl
(name: 'test' ⋄ value: 42 ⋄ data: (1 ⋄ 2))
```

**Parsed:**
```javascript
{
  "name": "test",
  "value": 42,
  "data": [
    1,
    2
  ]
}
```

**Output:**
```apl
(name: 'test' ⋄ value: 42 ⋄ data: 1 2)
```

---

## REAL-WORLD EXAMPLES


### Event table (EWC style)

```apl
[
 0   'All'
 1   'MouseDown'
 2   'MouseUp'
 3   'MouseMove'
]
```

**Parsed:**
```javascript
[
  [
    0,
    "All"
  ],
  [
    1,
    "MouseDown"
  ],
  [
    2,
    "MouseUp"
  ],
  [
    3,
    "MouseMove"
  ]
]
```

**Output:**
```apl
[0 'All' ⋄ 1 'MouseDown' ⋄ 2 'MouseUp' ⋄ 3 'MouseMove']
```

### Config table (TABLES.apla)

```apl
[
 'USERS'      'Users.csv'
 'MEMBERS'    'Members.csv'
 'WORK'       'Worklists.csv'
]
```

**Parsed:**
```javascript
[
  [
    "USERS",
    "Users.csv"
  ],
  [
    "MEMBERS",
    "Members.csv"
  ],
  [
    "WORK",
    "Worklists.csv"
  ]
]
```

**Output:**
```apl
['USERS' 'Users.csv' ⋄ 'MEMBERS' 'Members.csv' ⋄ 'WORK' 'Worklists.csv']
```

### Grid defaults pattern

```apl
(
 'Grid'
 0
 112 137
 225 275
 'Inherit'
 (
  'None'
  'None'
 )
)
```

**Parsed:**
```javascript
[
  "Grid",
  0,
  [
    112,
    137
  ],
  [
    225,
    275
  ],
  "Inherit",
  [
    "None",
    "None"
  ]
]
```

**Output:**
```apl
('Grid' ⋄ 0 ⋄ 112 137 ⋄ 225 275 ⋄ 'Inherit' ⋄ ('None' ⋄ 'None'))
```

### Class list

```apl
[
 ('Primitive ')
 ('System    ')
 ('Tacit     ')
 ('Dfn       ')
]
```

**Parsed:**
```javascript
[
  [
    "Primitive "
  ],
  [
    "System    "
  ],
  [
    "Tacit     "
  ],
  [
    "Dfn       "
  ]
]
```

**Output:**
```apl
['Primitive ' ⋄ 'System    ' ⋄ 'Tacit     ' ⋄ 'Dfn       ']
```

---

## COMPLEX NESTING


### Vector of matrices

```apl
([1 2 ⋄ 3 4] ⋄ [5 6 ⋄ 7 8])
```

**Parsed:**
```javascript
[
  [
    [
      1,
      2
    ],
    [
      3,
      4
    ]
  ],
  [
    [
      5,
      6
    ],
    [
      7,
      8
    ]
  ]
]
```

**Output:**
```apl
([1 2 ⋄ 3 4] ⋄ [5 6 ⋄ 7 8])
```

### Namespace with matrix

```apl
(name: 'data' ⋄ matrix: [1 2 ⋄ 3 4])
```

**Parsed:**
```javascript
{
  "name": "data",
  "matrix": [
    [
      1,
      2
    ],
    [
      3,
      4
    ]
  ]
}
```

**Output:**
```apl
(name: 'data' ⋄ matrix: [1 2 ⋄ 3 4])
```

### Matrix of nested vectors

```apl
[(1 ⋄ 2) ⋄ (3 ⋄ 4)]
```

**Parsed:**
```javascript
[
  [
    1,
    2
  ],
  [
    3,
    4
  ]
]
```

**Output:**
```apl
[1 2 ⋄ 3 4]
```

---

## MATRIX MODIFICATION ROUNDTRIP

### Receive matrix, modify cell, re-transmit

**Step 1:** Receive matrix from APLAN

```javascript
const mat = parse('[1 2 ⋄ 3 4]');
// mat = [[1,2],[3,4]]
// mat._shape = [2,2]
```

**Step 2:** Modify a cell using standard JS array access

```javascript
mat[0][1] = 99;
// mat = [[1,99],[3,4]]
```

**Step 3:** Re-serialize to APLAN

```javascript
serialize(mat)
```

**Output:**
```apl
[1 99 ⋄ 3 4]
```
