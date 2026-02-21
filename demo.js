/**
 * APLAN Demo - Shows all test cases with inputs and outputs
 *
 * Run with: node demo.js [--diamond]
 * Output is valid markdown
 */

import { parse, serialize } from './japlan.js';

const useDiamond = process.argv.includes('--diamond');

function demo(title, source, options = {}) {
  console.log(`\n### ${title}\n`);
  console.log('```apl');
  console.log(source);
  console.log('```\n');

  try {
    const parsed = parse(source);
    console.log('**Parsed:**');
    console.log('```javascript');
    console.log(JSON.stringify(parsed, null, 2));
    console.log('```\n');

    if (!options.skipSerialize) {
      const serialized = serialize(parsed, { useDiamond });
      console.log('**Output:**');
      console.log('```apl');
      console.log(serialized);
      console.log('```');
    }
  } catch (e) {
    console.log(`**Error:** ${e.message}`);
  }
}

function section(name) {
  console.log(`\n---\n\n## ${name}\n`);
}

console.log('# APLAN Parser Demo\n');
console.log('JavaScript Parser for Dyalog APL Array Notation\n');
console.log('This is not a demo for learning - more to test that all features work...\n');

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

// ============== Matrix Modification Workflow ==============
section('MATRIX MODIFICATION WORKFLOW');

console.log('### Receive matrix, modify cell, re-transmit\n');

console.log('**Step 1:** Receive matrix from APLAN\n');
console.log('```javascript');
console.log("const mat = parse('[1 2 ⋄ 3 4]');");
const mat = parse('[1 2 ⋄ 3 4]');
console.log(`// mat = ${JSON.stringify(mat)}`);
console.log(`// mat._shape = ${JSON.stringify(mat._shape)}`);
console.log('```\n');

console.log('**Step 2:** Modify a cell using standard JS array access\n');
console.log('```javascript');
console.log('mat[0][1] = 99;');
mat[0][1] = 99;
console.log(`// mat = ${JSON.stringify(mat)}`);
console.log('```\n');

console.log('**Step 3:** Re-serialize to APLAN\n');
console.log('```javascript');
console.log('serialize(mat)');
console.log('```\n');
console.log('**Output:**');
console.log('```apl');
const reserializedMat = serialize(mat, { useDiamond });
console.log(reserializedMat);
console.log('```');
