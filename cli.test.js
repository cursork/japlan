/**
 * Basic CLI tests
 */

import { execSync } from 'child_process';

let passed = 0;
let failed = 0;

const cli = (args) => `node cli.js ${args}`;

function test(name, cmd, expected) {
  try {
    const result = execSync(cmd, { encoding: 'utf-8' }).trim();
    if (result === expected) {
      console.log(`✓ ${name}`);
      passed++;
    } else {
      console.log(`✗ ${name}`);
      console.log(`  expected: ${expected}`);
      console.log(`  got:      ${result}`);
      failed++;
    }
  } catch (e) {
    console.log(`✗ ${name}`);
    console.log(`  error: ${e.message}`);
    failed++;
  }
}

console.log('=== CLI Tests ===\n');

// APLAN to JSON
test('a2j number', cli(`a2j '42'`), '42');
test('a2j vector', cli(`a2j '(1 ⋄ 2 ⋄ 3)'`), '[\n  1,\n  2,\n  3\n]');
test('a2j string', cli(`a2j "'hello'"`), '"hello"');
test('a2j namespace', cli(`a2j '(x: 1)'`), '{\n  "x": 1\n}');
test('a2j matrix', cli(`a2j '[1 2 ⋄ 3 4]'`), '[\n  [\n    1,\n    2\n  ],\n  [\n    3,\n    4\n  ]\n]');

// JSON to APLAN
test('j2a number', cli(`j2a '42'`), '42');
test('j2a array', cli(`j2a '[1,2,3]'`), '1 2 3');
test('j2a string', cli(`j2a '"hello"'`), "'hello'");
test('j2a object', cli(`j2a '{"x":1}'`), '(x: 1)');
test('j2a namespace', cli(`j2a '{"_ns":true,"x":1}'`), '(x: 1)');
test('j2a matrix', cli(`j2a '{"_matrix":[[1,2],[3,4]]}'`), '[1 2 ⋄ 3 4]');

// Piped input
test('pipe aplan', `echo "(1 ⋄ 2)" | node cli.js`, '[\n  1,\n  2\n]');
test('pipe json', `echo '{"a":1}' | node cli.js`, '(a: 1)');

console.log(`\n=== Summary ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);

process.exit(failed > 0 ? 1 : 0);
