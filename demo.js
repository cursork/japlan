/**
 * APLAN Demo - Shows all test cases with inputs and outputs
 *
 * Run with: node demo.js
 */

import { parse, serialize } from './aplan.js';

function demo(title, source, options = {}) {
  console.log(`\n### ${title}`);
  console.log(`Input:  ${source.replace(/\n/g, '\\n')}`);

  try {
    const parsed = parse(source);
    const display = JSON.stringify(parsed, null, 2).replace(/\n/g, '\n        ');
    console.log(`Parsed: ${display}`);

    if (!options.skipSerialize) {
      const serialized = serialize(parsed, { useDiamond: true });
      console.log(`Serial: ${serialized.replace(/\n/g, '\\n')}`);
    }
  } catch (e) {
    console.log(`Error:  ${e.message}`);
  }
}

function section(name) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${name}`);
  console.log('='.repeat(60));
}

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    APLAN PARSER DEMO                         ║
║         JavaScript Parser for Dyalog APL Array Notation      ║
╚══════════════════════════════════════════════════════════════╝
`);

// ============== Numbers ==============
section('NUMBERS');

demo('Integer', '42');
demo('Zero', '0');
demo('Negative (high minus ¯)', '¯5');
demo('Float', '3.14');
demo('Negative float', '¯2.5');
demo('Exponential notation', '1E5');
demo('Negative exponent', '2.5E¯3');
demo('Very small number', '1E¯10');
demo('Very large number', '1E10');
demo('Complex number (J notation)', '3J4');
demo('Complex with negatives', '¯2J¯3');
demo('Complex with exponential', '1E2J3E1');

// ============== Number Strands ==============
section('NUMBER STRANDS (vectors without parens)');

demo('Simple strand', '1 2 3');
demo('Negative numbers', '¯1 0 1');
demo('Mixed integers and floats', '1 2.5 3');

// ============== Strings ==============
section('STRINGS');

demo('Simple string', "'hello'");
demo('Empty string', "''");
demo('String with spaces', "'hello world'");
demo('Escaped quote (doubled)', "'it''s'");
demo('Multiple escaped quotes', "'say ''hello'''");
demo('String strand', "'a' 'b' 'c'");

// ============== Zilde ==============
section('ZILDE (empty numeric vector)');

demo('Zilde symbol ⍬', '⍬');

// ============== Vectors ==============
section('VECTORS (parentheses with separators)');

demo('Vector with diamonds', '(1 ⋄ 2 ⋄ 3)');
demo('Vector with newlines', '(1\n2\n3)');
demo('Mixed types', "(1 ⋄ 'two' ⋄ 3)");
demo('Nested vectors', '((1 ⋄ 2) ⋄ (3 ⋄ 4))');
demo('Single element (trailing sep)', '(42 ⋄)');
demo('Single element (leading sep)', '(⋄ 42)');
demo('Grouping only (no sep) = scalar', '(42)');
demo('Vector of strings', "('a' ⋄ 'b' ⋄ 'c')");
demo('Strands in vector', '(1 2 ⋄ 3 4)');
demo('Strands different lengths', '(1 2 ⋄ 3 4 5)');
demo('Deeply nested', '(((1 ⋄ 2) ⋄ (3 ⋄ 4)) ⋄ ((5 ⋄ 6) ⋄ (7 ⋄ 8)))');
demo('Multiple separators ignored', '(1 ⋄ ⋄ 2)');
demo('Trailing separator', '(1 ⋄ 2 ⋄)');

// ============== Matrices ==============
section('MATRICES (square brackets)');

demo('2×2 matrix', '[1 2 ⋄ 3 4]');
demo('2×3 matrix', '[1 2 3 ⋄ 4 5 6]');
demo('3×1 column matrix', '[1 ⋄ 2 ⋄ 3]');
demo('Padding shorter rows', '[1 2 ⋄ 3 4 5]');
demo('String matrix', "['a' 'b' ⋄ 'c' 'd']");
demo('Empty brackets', '[]');

demo('Matrix with newlines', `[
 1 2 3
 4 5 6
 7 8 9
]`);

// ============== Namespaces ==============
section('NAMESPACES (name: value pairs)');

demo('Empty namespace', '()');
demo('Single member', '(x: 42)');
demo('Multiple members', '(x: 1 ⋄ y: 2)');
demo('String value', "(name: 'John')");
demo('Array value', '(data: (1 ⋄ 2 ⋄ 3))');
demo('Matrix value', '(grid: [1 2 ⋄ 3 4])');
demo('Nested namespace', '(outer: (inner: 42))');
demo('Mixed types', "(name: 'test' ⋄ value: 42 ⋄ data: (1 ⋄ 2))");

// ============== Real-World Examples ==============
section('REAL-WORLD EXAMPLES');

demo('Event table (EWC style)', `[
 0   'All'
 1   'MouseDown'
 2   'MouseUp'
 3   'MouseMove'
]`);

demo('Config table (TABLES.apla)', `[
 'USERS'      'Users.csv'
 'MEMBERS'    'Members.csv'
 'WORK'       'Worklists.csv'
]`);

demo('Grid defaults pattern', `(
 'Grid'
 0
 112 137
 225 275
 'Inherit'
 (
  'None'
  'None'
 )
)`);

demo('Class list', `[
 ('Primitive ')
 ('System    ')
 ('Tacit     ')
 ('Dfn       ')
]`);

// ============== Complex Nesting ==============
section('COMPLEX NESTING');

demo('Vector of matrices', '([1 2 ⋄ 3 4] ⋄ [5 6 ⋄ 7 8])');
demo('Namespace with matrix', "(name: 'data' ⋄ matrix: [1 2 ⋄ 3 4])");
demo('Matrix of nested vectors', '[(1 ⋄ 2) ⋄ (3 ⋄ 4)]');

// ============== Serialization Examples ==============
section('SERIALIZATION (JavaScript → APLAN)');

console.log('\n### Number');
console.log('Input:  42');
console.log(`Output: ${serialize(42)}`);

console.log('\n### Negative number');
console.log('Input:  -5');
console.log(`Output: ${serialize(-5)}`);

console.log('\n### String');
console.log('Input:  "hello"');
console.log(`Output: ${serialize("hello")}`);

console.log('\n### String with quote');
console.log('Input:  "it\'s"');
console.log(`Output: ${serialize("it's")}`);

console.log('\n### Number array');
console.log('Input:  [1, 2, 3]');
console.log(`Output: ${serialize([1, 2, 3])}`);

console.log('\n### Mixed array');
console.log('Input:  [1, "two", 3]');
console.log(`Output: ${serialize([1, "two", 3], { useDiamond: true })}`);

console.log('\n### Empty array');
console.log('Input:  []');
console.log(`Output: ${serialize([])}`);

console.log('\n### Complex number');
console.log('Input:  { re: 3, im: 4 }');
console.log(`Output: ${serialize({ re: 3, im: 4 })}`);

console.log('\n### Namespace (object)');
console.log('Input:  { x: 1, y: 2 }');
console.log(`Output: ${serialize({ x: 1, y: 2 }, { useDiamond: true })}`);

console.log('\n### Nested array');
console.log('Input:  [[1, 2], [3, 4]]');
console.log(`Output: ${serialize([[1, 2], [3, 4]], { useDiamond: true })}`);

// ============== Summary ==============
console.log(`
${'='.repeat(60)}
  SUMMARY
${'='.repeat(60)}

APLAN Syntax:
  • Vectors:    (a ⋄ b ⋄ c)     or multiline
  • Matrices:   [a ⋄ b ⋄ c]     rows become major cells
  • Namespaces: (x: 1 ⋄ y: 2)   key-value pairs
  • Numbers:    42  ¯5  3.14  1E5  3J4
  • Strings:    'text'  'it''s'
  • Zilde:      ⍬ (empty vector)

JavaScript Representation:
  • Scalars  → number | string | { re, im }
  • Vectors  → array
  • Matrices → { __aplan_matrix__: true, shape: [...], data: [...] }
  • Namespaces → { __aplan_ns__: true, ...properties }
`);
