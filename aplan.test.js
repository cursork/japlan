/**
 * Test suite for APLAN parser/serializer
 *
 * Run with: node aplan.test.js
 */

import { parse, serialize, equal, get, zilde, APL_NS } from './aplan.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${e.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEq(actual, expected, message) {
  if (!equal(actual, expected)) {
    throw new Error(
      `${message || 'Not equal'}\n  Expected: ${JSON.stringify(expected)}\n  Actual:   ${JSON.stringify(actual)}`
    );
  }
}

function roundTrip(source, expected) {
  const parsed = parse(source);
  assertEq(parsed, expected, `Parse failed for: ${source}`);

  const serialized = serialize(parsed, { useDiamond: true });
  const reparsed = parse(serialized);
  assertEq(reparsed, expected, `Round-trip failed for: ${source}`);
}

console.log('=== APLAN Parser Tests ===\n');

// ============== Numbers ==============
console.log('--- Numbers ---');

test('integer', () => {
  assertEq(parse('42'), 42);
});

test('zero', () => {
  assertEq(parse('0'), 0);
});

test('negative integer', () => {
  assertEq(parse('¯5'), -5);
});

test('float', () => {
  assertEq(parse('3.14'), 3.14);
});

test('negative float', () => {
  assertEq(parse('¯2.5'), -2.5);
});

test('exponential', () => {
  assertEq(parse('1E5'), 100000);
});

test('exponential with negative exponent', () => {
  assertEq(parse('2.5E¯3'), 0.0025);
});

test('complex number', () => {
  const result = parse('3J4');
  assertEq(result, { re: 3, im: 4 });
});

test('complex with negatives', () => {
  const result = parse('¯2J¯3');
  assertEq(result, { re: -2, im: -3 });
});

test('number vector (strand)', () => {
  assertEq(parse('1 2 3'), [1, 2, 3]);
});

test('negative number vector', () => {
  assertEq(parse('¯1 0 1'), [-1, 0, 1]);
});

// ============== Strings ==============
console.log('\n--- Strings ---');

test('simple string', () => {
  assertEq(parse("'hello'"), 'hello');
});

test('empty string', () => {
  assertEq(parse("''"), '');
});

test('string with escaped quote', () => {
  assertEq(parse("'it''s'"), "it's");
});

test('string with multiple quotes', () => {
  assertEq(parse("'say ''hello'''"), "say 'hello'");
});

test('string with spaces', () => {
  assertEq(parse("'hello world'"), 'hello world');
});

// ============== Zilde ==============
console.log('\n--- Zilde ---');

test('zilde (empty vector)', () => {
  assertEq(parse('⍬'), []);
});

test('zilde is sentinel', () => {
  const result = parse('⍬');
  assert(result === zilde, 'parsed zilde should === zilde sentinel');
});

test('zilde sentinel is frozen', () => {
  assert(Object.isFrozen(zilde), 'zilde should be frozen');
});

test('serialize zilde sentinel', () => {
  assertEq(serialize(zilde), '⍬');
});

test('zilde round-trip with sentinel', () => {
  const parsed = parse('⍬');
  assert(parsed === zilde);
  const serialized = serialize(parsed);
  assertEq(serialized, '⍬');
  const reparsed = parse(serialized);
  assert(reparsed === zilde);
});

// ============== Get Function ==============
console.log('\n--- Get Function ---');

test('get from simple array', () => {
  const arr = [1, 2, 3];
  assertEq(get(arr, 0), 1);
  assertEq(get(arr, 1), 2);
  assertEq(get(arr, 2), 3);
});

test('get from array with array index', () => {
  const arr = [1, 2, 3];
  assertEq(get(arr, [1]), 2);
});

test('get from nested array', () => {
  const arr = [[1, 2], [3, 4]];
  assertEq(get(arr, [0, 0]), 1);
  assertEq(get(arr, [0, 1]), 2);
  assertEq(get(arr, [1, 0]), 3);
  assertEq(get(arr, [1, 1]), 4);
});

test('get from parsed nested vector', () => {
  const parsed = parse('((1 2) ⋄ (3 4))');
  assertEq(get(parsed, [0, 0]), 1);
  assertEq(get(parsed, [1, 1]), 4);
});

test('get from matrix', () => {
  const mat = parse('[1 2 ⋄ 3 4]');
  assertEq(get(mat, [0, 0]), 1);
  assertEq(get(mat, [0, 1]), 2);
  assertEq(get(mat, [1, 0]), 3);
  assertEq(get(mat, [1, 1]), 4);
});

test('get from 3x3 matrix', () => {
  const mat = parse('[1 2 3 ⋄ 4 5 6 ⋄ 7 8 9]');
  assertEq(get(mat, [0, 0]), 1);
  assertEq(get(mat, [1, 1]), 5);
  assertEq(get(mat, [2, 2]), 9);
  assertEq(get(mat, [2, 0]), 7);
});

test('get outer element from nested array', () => {
  const arr = [[1, 2], [3, 4]];
  assertEq(get(arr, 0), [1, 2]);
  assertEq(get(arr, 1), [3, 4]);
});

test('get throws on zilde', () => {
  let threw = false;
  try {
    get(zilde, 0);
  } catch (e) {
    threw = true;
    assert(e.message.includes('zilde'), 'error should mention zilde');
  }
  assert(threw, 'should throw on zilde');
});

test('get throws on out of bounds', () => {
  let threw = false;
  try {
    get([1, 2, 3], 5);
  } catch (e) {
    threw = true;
    assert(e.message.includes('out of bounds'), 'error should mention out of bounds');
  }
  assert(threw, 'should throw on out of bounds');
});

test('get throws on matrix index rank mismatch', () => {
  const mat = parse('[1 2 ⋄ 3 4]');
  let threw = false;
  try {
    get(mat, 0); // should require [row, col]
  } catch (e) {
    threw = true;
    assert(e.message.includes('rank'), 'error should mention rank');
  }
  assert(threw, 'should throw on rank mismatch');
});

// ============== Vectors ==============
console.log('\n--- Vectors ---');

test('simple vector with diamond', () => {
  assertEq(parse('(1 ⋄ 2 ⋄ 3)'), [1, 2, 3]);
});

test('vector with newlines', () => {
  assertEq(parse('(1\n2\n3)'), [1, 2, 3]);
});

test('mixed vector', () => {
  assertEq(parse("(1 ⋄ 'two' ⋄ 3)"), [1, 'two', 3]);
});

test('nested vector', () => {
  assertEq(parse('((1 ⋄ 2) ⋄ (3 ⋄ 4))'), [[1, 2], [3, 4]]);
});

test('single element vector (trailing sep)', () => {
  assertEq(parse('(42 ⋄)'), [42]);
});

test('single element vector (leading sep)', () => {
  assertEq(parse('(⋄ 42)'), [42]);
});

test('vector of strings', () => {
  assertEq(parse("('a' ⋄ 'b' ⋄ 'c')"), ['a', 'b', 'c']);
});

test('vector with number strands', () => {
  assertEq(parse('(1 2 ⋄ 3 4)'), [[1, 2], [3, 4]]);
});

// ============== Matrices ==============
console.log('\n--- Matrices ---');

test('simple matrix', () => {
  const result = parse('[1 2 ⋄ 3 4]');
  assert(Array.isArray(result), 'matrix should be array');
  assertEq(result._shape, [2, 2]);
  assertEq(result[0], [1, 2]);
  assertEq(result[1], [3, 4]);
});

test('column matrix', () => {
  const result = parse('[1 ⋄ 2 ⋄ 3]');
  assert(Array.isArray(result), 'matrix should be array');
  assertEq(result._shape, [3, 1]);
  assertEq(result[0], [1]);
  assertEq(result[1], [2]);
  assertEq(result[2], [3]);
});

test('matrix with different row lengths (padding)', () => {
  const result = parse('[1 2 ⋄ 3 4 5]');
  assert(Array.isArray(result), 'matrix should be array');
  assertEq(result._shape, [2, 3]);
  // First row should be padded with 0
  assertEq(result[0], [1, 2, 0]);
  assertEq(result[1], [3, 4, 5]);
});

test('empty brackets', () => {
  const result = parse('[]');
  assert(Array.isArray(result), 'empty matrix should be array');
  assertEq(result._shape, [0]);
  assertEq(result.length, 0);
});

// ============== Namespaces ==============
console.log('\n--- Namespaces ---');

test('empty namespace', () => {
  const result = parse('()');
  assertEq(result[APL_NS], true);
});

test('simple namespace', () => {
  const result = parse('(x: 1 ⋄ y: 2)');
  assertEq(result[APL_NS], true);
  assertEq(result.x, 1);
  assertEq(result.y, 2);
});

test('namespace with string value', () => {
  const result = parse("(name: 'John')");
  assertEq(result.name, 'John');
});

test('namespace with array value', () => {
  const result = parse('(data: (1 ⋄ 2 ⋄ 3))');
  assertEq(result.data, [1, 2, 3]);
});

test('nested namespace', () => {
  const result = parse('(outer: (inner: 42))');
  assertEq(result.outer[APL_NS], true);
  assertEq(result.outer.inner, 42);
});

// ============== Real-world Examples ==============
console.log('\n--- Real-world Examples ---');

test('TABLES.apla style', () => {
  const source = `[
 'USERS'      'Users.csv'
 'MEMBERS'    'Members.csv'
]`;
  const result = parse(source);
  assert(Array.isArray(result), 'should be array');
  assertEq(result._shape[0], 2); // 2 rows
});

test('nested parentheses', () => {
  const source = `(
 'Grid'
 0
 (
  1 1
  1 1
 )
)`;
  const result = parse(source);
  assert(Array.isArray(result));
  assertEq(result[0], 'Grid');
  assertEq(result[1], 0);
});

// ============== Serialization ==============
console.log('\n--- Serialization ---');

test('serialize number', () => {
  assertEq(serialize(42), '42');
});

test('serialize negative number', () => {
  assertEq(serialize(-5), '¯5');
});

test('serialize float', () => {
  assertEq(serialize(3.14), '3.14');
});

test('serialize string', () => {
  assertEq(serialize('hello'), "'hello'");
});

test('serialize string with quote', () => {
  assertEq(serialize("it's"), "'it''s'");
});

test('serialize empty array', () => {
  assertEq(serialize([]), '⍬');
});

test('serialize number array (strand)', () => {
  assertEq(serialize([1, 2, 3]), '1 2 3');
});

test('serialize complex number', () => {
  assertEq(serialize({ re: 3, im: 4 }), '3J4');
});

test('serialize namespace', () => {
  const ns = { x: 1, y: 2 };
  ns[APL_NS] = true;
  const result = serialize(ns, { useDiamond: true });
  assert(result.includes('x: 1'));
  assert(result.includes('y: 2'));
});

// ============== Round-trip Tests ==============
console.log('\n--- Round-trip Tests ---');

test('round-trip: number', () => {
  roundTrip('42', 42);
});

test('round-trip: negative', () => {
  roundTrip('¯123', -123);
});

test('round-trip: string', () => {
  roundTrip("'hello world'", 'hello world');
});

test('round-trip: vector', () => {
  roundTrip('(1 ⋄ 2 ⋄ 3)', [1, 2, 3]);
});

test('round-trip: mixed vector', () => {
  roundTrip("(1 ⋄ 'two' ⋄ 3)", [1, 'two', 3]);
});

test('round-trip: nested vector', () => {
  roundTrip('((1 ⋄ 2) ⋄ (3 ⋄ 4))', [[1, 2], [3, 4]]);
});

test('round-trip: namespace', () => {
  const ns = parse('(x: 1 ⋄ y: 2)');
  const serialized = serialize(ns, { useDiamond: true });
  const reparsed = parse(serialized);
  assertEq(reparsed.x, 1);
  assertEq(reparsed.y, 2);
});

// ============== Edge Cases ==============
console.log('\n--- Edge Cases ---');

test('whitespace handling', () => {
  assertEq(parse('  42  '), 42);
});

test('multiple separators', () => {
  assertEq(parse('(1 ⋄ ⋄ 2)'), [1, 2]);
});

test('trailing separator in vector', () => {
  assertEq(parse('(1 ⋄ 2 ⋄)'), [1, 2]);
});

test('grouping parentheses (no separator)', () => {
  assertEq(parse('(42)'), 42);
});

test('deeply nested', () => {
  const result = parse('(((1)))');
  assertEq(result, 1);
});

// ============== Matrix Round-trips ==============
console.log('\n--- Matrix Round-trips ---');

test('round-trip: simple matrix', () => {
  const source = '[1 2 ⋄ 3 4]';
  const parsed = parse(source);
  assertEq(parsed._shape, [2, 2]);
  assertEq(parsed[0], [1, 2]);
  assertEq(parsed[1], [3, 4]);

  const serialized = serialize(parsed, { useDiamond: true });
  const reparsed = parse(serialized);
  assertEq(reparsed._shape, [2, 2]);
  assertEq(reparsed[0], [1, 2]);
  assertEq(reparsed[1], [3, 4]);
});

test('round-trip: string matrix', () => {
  const source = "['a' 'b' ⋄ 'c' 'd']";
  const parsed = parse(source);
  assertEq(parsed._shape, [2, 2]);
  assertEq(parsed[0], ['a', 'b']);
  assertEq(parsed[1], ['c', 'd']);
});

test('round-trip: column matrix', () => {
  const source = '[1 ⋄ 2 ⋄ 3]';
  const parsed = parse(source);
  assertEq(parsed._shape, [3, 1]);
  assertEq(parsed[0], [1]);
  assertEq(parsed[1], [2]);
  assertEq(parsed[2], [3]);
});

// ============== Complex Nesting ==============
console.log('\n--- Complex Nesting ---');

test('vector containing matrices', () => {
  const source = '([1 2 ⋄ 3 4] ⋄ [5 6 ⋄ 7 8])';
  const parsed = parse(source);
  assert(Array.isArray(parsed));
  assertEq(parsed.length, 2);
  assert(parsed[0]._shape, 'first element should have _shape');
  assert(parsed[1]._shape, 'second element should have _shape');
});

test('namespace with matrix value', () => {
  const source = "(data: [1 2 ⋄ 3 4] ⋄ name: 'test')";
  const parsed = parse(source);
  assertEq(parsed[APL_NS], true);
  assert(parsed.data._shape, 'data should have _shape');
});

test('deeply nested vectors', () => {
  const source = '(((1 ⋄ 2) ⋄ (3 ⋄ 4)) ⋄ ((5 ⋄ 6) ⋄ (7 ⋄ 8)))';
  const parsed = parse(source);
  assertEq(parsed, [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]);
});

// ============== APL-style Examples ==============
console.log('\n--- APL-style Examples ---');

test('Grid defaults pattern', () => {
  const source = `(
 'Grid'
 0
 112 137
 225 275
 'Inherit'
 1 1
 (
  'None'
  'None'
 )
)`;
  const parsed = parse(source);
  assert(Array.isArray(parsed));
  assertEq(parsed[0], 'Grid');
  assertEq(parsed[1], 0);
  assertEq(parsed[2], [112, 137]);
});

test('Event table pattern', () => {
  const source = `[
 0   'All'
 1   'MouseDown'
 2   'MouseUp'
]`;
  const parsed = parse(source);
  assert(Array.isArray(parsed), 'should be array');
  assertEq(parsed._shape[0], 3); // 3 rows
});

// ============== Special Number Formats ==============
console.log('\n--- Special Number Formats ---');

test('very small exponential', () => {
  assertEq(parse('1E¯10'), 1e-10);
});

test('very large exponential', () => {
  assertEq(parse('1E10'), 1e10);
});

test('negative exponential number', () => {
  assertEq(parse('¯2.5E3'), -2500);
});

test('complex with exponential', () => {
  const result = parse('1E2J3E1');
  assertEq(result.re, 100);
  assertEq(result.im, 30);
});

// ============== Summary ==============
console.log('\n=== Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
