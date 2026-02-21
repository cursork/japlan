/**
 * Tests japlan against Dyalog APL
 *
 * Strategy: For each APLAN input, verify that japlan and Dyalog
 * parse it to semantically equivalent values.
 *
 * Method:
 *   1. Parse input with japlan → JS value
 *   2. Send input to Dyalog: parse then serialize back to APLAN (with ⋄)
 *   3. Parse Dyalog's output with japlan → JS value
 *   4. Compare the two JS values with equal()
 *
 * Requires: Dyalog APL accessible via gritt on localhost:4502
 * Run with: node dyalog.test.js
 */

import { execSync } from 'child_process';
import { parse, serialize, equal, _ns } from './japlan.js';

const GRITT = process.env.GRITT || `${process.env.HOME}/dev/gritt/gritt`;

function apl(expr) {
  try {
    return execSync(`${GRITT} -e "${expr.replace(/"/g, '\\"')}"`, {
      encoding: 'utf-8',
      timeout: 5000
    }).trim();
  } catch (e) {
    throw new Error(`APL error: ${e.stderr || e.message}`);
  }
}

function dyalogRoundTrip(aplan) {
  // Escape for shell (double backslashes) then for APL string (double quotes)
  const escaped = aplan.replace(/\\/g, '\\\\').replace(/'/g, "''");
  // 1 = serialize with diamonds (proper APLAN format)
  return apl(`1 ⎕SE.Dyalog.Array.Serialise ⎕SE.Dyalog.Array.Deserialise '${escaped}'`);
}

let passed = 0;
let failed = 0;
let skipped = 0;

function test(aplan, opts = {}) {
  const display = aplan.replace(/\n/g, '⋄').slice(0, 60);

  if (opts.skip) {
    console.log(`- ${display} (skipped: ${opts.skip})`);
    skipped++;
    return;
  }

  try {
    const jsValue = parse(aplan);
    const dyalogAplan = dyalogRoundTrip(aplan);
    const dyalogValue = parse(dyalogAplan);

    if (equal(jsValue, dyalogValue)) {
      console.log(`✓ ${display}`);
      passed++;
    } else {
      console.log(`✗ ${display}`);
      console.log(`  input:   ${aplan}`);
      console.log(`  japlan:  ${JSON.stringify(jsValue)}`);
      console.log(`  dyalog:  ${dyalogAplan}`);
      console.log(`  parsed:  ${JSON.stringify(dyalogValue)}`);
      failed++;
    }
  } catch (e) {
    console.log(`✗ ${display}`);
    console.log(`  error: ${e.message}`);
    failed++;
  }
}

// Verify connection
console.log('=== Dyalog Integration Tests ===\n');
try {
  const r = apl('1+1');
  if (r !== '2') throw new Error(`expected 2, got ${r}`);
  console.log('Connected to Dyalog via gritt\n');
} catch (e) {
  console.error('Cannot connect to Dyalog. Ensure gritt is available and Dyalog is running.');
  console.error(e.message);
  process.exit(1);
}

// === Scalars ===
console.log('--- Scalars ---');
test('42');
test('0');
test('¯5');
test('3.14');
test('¯2.5');
test('1E5');
test('2.5E¯3');
test('3J4');
test('¯2J¯3');
test('1E2J3E1');

// === Strands ===
console.log('\n--- Strands ---');
test('1 2 3');
test('¯1 0 1');
test('1 2.5 3');

// === Strings ===
console.log('\n--- Strings ---');
test("'hello'");
test("''");
test("'hello world'");
test("'it''s'");
test("'say ''hi'''");

// === Zilde ===
console.log('\n--- Zilde ---');
test('⍬');

// === Vectors ===
console.log('\n--- Vectors ---');
test('(1 ⋄ 2 ⋄ 3)');
test("(1 ⋄ 'two' ⋄ 3)");
test('((1 ⋄ 2) ⋄ (3 ⋄ 4))');
test('(42 ⋄)');
test('(⋄ 42)');
test('(42)');  // grouping, not vector
test('(1 2 ⋄ 3 4)');

test("('a' ⋄ 'b' ⋄ 'c')");  // char vector should become string

// === Matrices ===
console.log('\n--- Matrices ---');
test('[1 2 ⋄ 3 4]');
test('[1 2 3 ⋄ 4 5 6]');
test('[1 ⋄ 2 ⋄ 3]');
test("['ab' ⋄ 'cd']");

// === Namespaces ===
console.log('\n--- Namespaces ---');
test('()');
test('(x: 42)');
test('(x: 1 ⋄ y: 2)');
test("(name: 'John')");
test('(data: (1 ⋄ 2 ⋄ 3))');
test('(grid: [1 2 ⋄ 3 4])');
test('(outer: (inner: 42))');

// === Nesting ===
console.log('\n--- Complex Nesting ---');
test('([1 2 ⋄ 3 4] ⋄ [5 6 ⋄ 7 8])');
test("(name: 'data' ⋄ matrix: [1 2 ⋄ 3 4])");
test('[(1 ⋄ 2) ⋄ (3 ⋄ 4)]');

// === Character vectors ===
console.log('\n--- Character Vectors ---');
test("('x' ⋄ 'y')");
test("('H' ⋄ 'i' ⋄ '!')");
test("((' ' ⋄) ⋄ ('a' ⋄ 'b'))");  // nested: space char + "ab"

// === String edge cases ===
console.log('\n--- String Edge Cases ---');
test("'a'");                    // single char
test("' '");                    // space
test("''''");                   // just a quote
test("'a\\b'");                 // string with one backslash

// === Number edge cases ===
console.log('\n--- Number Edge Cases ---');
test('0.5');
test('¯0.5');
test('1E10');
test('1E¯10');
test('0J1');                    // pure imaginary
test('0J¯1');
test('1J0');                    // real as complex
test('¯1J1');
test('1.5J2.5');

// === Strand variations ===
console.log('\n--- Strand Variations ---');
test('1 2 3 4 5');
test('¯1 ¯2 ¯3');
test('1.1 2.2 3.3');
test("'ab' 'cd' 'ef'");         // string strand

// === Vector edge cases ===
console.log('\n--- Vector Edge Cases ---');
test('(⍬ ⋄ ⍬)');                // vector of zildes
test('(⍬ ⋄ 1 ⋄ ⍬)');            // zilde mixed with number
test('((1 ⋄) ⋄ (2 ⋄))');        // nested single-element vectors
test('(1 ⋄ (2 ⋄ 3) ⋄ 4)');      // mixed nesting
test('(1 ⋄ 2 ⋄ 3 ⋄ 4 ⋄ 5)');    // longer vector

// === Matrix variations ===
console.log('\n--- Matrix Variations ---');
test('[1 ⋄ 2 ⋄ 3 ⋄ 4]');        // 4x1 column
test('[1 2 3 4 ⋄ 5 6 7 8]');    // 2x4
test('[1 2 ⋄ 3 4 ⋄ 5 6]');      // 3x2
test("['hello' ⋄ 'world']");    // string column
test('[(1 ⋄ 2 ⋄ 3) ⋄ (4 ⋄ 5 ⋄ 6)]');  // vectors as rows

// === Namespace variations ===
console.log('\n--- Namespace Variations ---');
test('(a: 1 ⋄ b: 2 ⋄ c: 3)');
test("(empty: () ⋄ full: (x: 1))");  // nested namespaces
test('(vec: (1 ⋄ 2) ⋄ mat: [3 4 ⋄ 5 6])');
test("(s: 'hello' ⋄ n: 42 ⋄ v: 1 2 3)");
test('(deep: (deeper: (deepest: 1)))');

// === Mixed complex structures ===
console.log('\n--- Mixed Structures ---');
test('((x: 1) ⋄ (y: 2))');      // vector of namespaces
test('[(x: 1) ⋄ (y: 2)]');      // matrix of namespaces
test("(items: ('a' ⋄ 'b' ⋄ 'c') ⋄ count: 3)");
test('[1 2 3 ⋄ 4 5 6 ⋄ 7 8 9]');  // 3x3

// === Real-world patterns ===
console.log('\n--- Real-World Patterns ---');
test("(type: 'button' ⋄ id: 42 ⋄ pos: 10 20)");
test("[(name: 'Alice' ⋄ age: 30) ⋄ (name: 'Bob' ⋄ age: 25)]");
test("(rows: [1 2 ⋄ 3 4] ⋄ cols: [5 6 ⋄ 7 8])");
test("('header' ⋄ [1 2 3 ⋄ 4 5 6] ⋄ 'footer')");

// === Newline separators (local comparison - shell can't pass newlines to gritt) ===
console.log('\n--- Newline Separators ---');

function testNewline(withNewlines, withDiamonds) {
  const display = withNewlines.replace(/\n/g, '\\n').slice(0, 50);
  try {
    const a = parse(withNewlines);
    const b = parse(withDiamonds);
    if (equal(a, b)) {
      console.log(`✓ ${display}`);
      passed++;
    } else {
      console.log(`✗ ${display}`);
      console.log(`  newlines: ${JSON.stringify(a)}`);
      console.log(`  diamonds: ${JSON.stringify(b)}`);
      failed++;
    }
  } catch (e) {
    console.log(`✗ ${display}`);
    console.log(`  error: ${e.message}`);
    failed++;
  }
}

testNewline('(1\n2\n3)', '(1 ⋄ 2 ⋄ 3)');
testNewline('[1 2\n3 4]', '[1 2 ⋄ 3 4]');
testNewline('(x: 1\ny: 2)', '(x: 1 ⋄ y: 2)');
testNewline('[\n1 2\n3 4\n]', '[1 2 ⋄ 3 4]');

// === APL identifiers ===
console.log('\n--- APL Identifiers ---');
test('(∆x: 1)');
test('(⍙y: 2)');
test('(ABC∆123: 42)');

// === Reverse round-trip: japlan serialize → Dyalog parse ===
console.log('\n--- Reverse Round-trip (serialize validation) ---');

function testSerialize(jsValue, label) {
  const display = label.slice(0, 50);
  try {
    // Serialize with japlan
    const aplan = serialize(jsValue, { useDiamond: true });

    // Send to Dyalog to parse and re-serialize
    const escaped = aplan.replace(/\\/g, '\\\\').replace(/'/g, "''");
    const dyalogAplan = apl(`1 ⎕SE.Dyalog.Array.Serialise ⎕SE.Dyalog.Array.Deserialise '${escaped}'`);

    // Parse both with japlan and compare
    const fromJaplan = parse(aplan);
    const fromDyalog = parse(dyalogAplan);

    if (equal(fromJaplan, fromDyalog)) {
      console.log(`✓ ${display}`);
      passed++;
    } else {
      console.log(`✗ ${display}`);
      console.log(`  serialized: ${aplan}`);
      console.log(`  dyalog:     ${dyalogAplan}`);
      failed++;
    }
  } catch (e) {
    console.log(`✗ ${display}`);
    console.log(`  error: ${e.message}`);
    failed++;
  }
}

testSerialize(42, 'number');
testSerialize(-5, 'negative');
testSerialize([1, 2, 3], 'vector');
testSerialize([[1,2],[3,4]], 'nested array');
testSerialize({ x: 1, y: 2 }, 'object as namespace');
testSerialize('hello', 'string');
testSerialize("it's", 'string with quote');
testSerialize({ re: 3, im: 4 }, 'complex number');

// Matrix with _shape
const mat = [[1,2],[3,4]];
mat._shape = [2, 2];
testSerialize(mat, 'matrix with _shape');

// Namespace with _ns
const ns = { a: 1, b: 2 };
ns[_ns] = true;
testSerialize(ns, 'namespace with _ns');

// === Summary ===
console.log('\n=== Summary ===');
console.log(`Passed:  ${passed}`);
console.log(`Failed:  ${failed}`);
console.log(`Skipped: ${skipped}`);
console.log(`Total:   ${passed + failed + skipped}`);

process.exit(failed > 0 ? 1 : 0);
