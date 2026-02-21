/**
 * Extracts and tests all JavaScript code blocks from README.md
 * Run with: node readme.test.js
 */

import { readFileSync } from 'fs';
import { parse, serialize, equal, get, zilde, _ns } from './japlan.js';

const readme = readFileSync('README.md', 'utf-8');

// Extract all ```javascript ... ``` blocks
const codeBlocks = [];
const regex = /```javascript\n([\s\S]*?)```/g;
let match;
while ((match = regex.exec(readme)) !== null) {
  codeBlocks.push(match[1]);
}

console.log(`=== README Code Block Tests ===`);
console.log(`Found ${codeBlocks.length} JavaScript code blocks\n`);

let passed = 0;
let failed = 0;

for (let i = 0; i < codeBlocks.length; i++) {
  const code = codeBlocks[i];
  const preview = code.split('\n')[0].slice(0, 50) + '...';

  try {
    // Replace "// →" comments with assertions, strip imports
    const testCode = code
      .split('\n')
      .map(line => {
        // Skip import statements (already in scope)
        if (line.trim().startsWith('import ')) {
          return '';
        }
        // Handle lines like: parse('42')  // → 42
        const arrowMatch = line.match(/^(.+?)\s*\/\/\s*→\s*(.+)$/);
        if (arrowMatch) {
          const [, expr, expected] = arrowMatch;
          // Skip if it's just a comment line or contains "with"
          if (expected.includes('with ')) {
            // e.g. "[[1, 2], [3, 4]] with _shape" - just verify no error
            return `{ const __r = ${expr}; }`;
          }
          return `{ const __r = ${expr}; const __e = ${expected}; if (!equal(__r, __e)) throw new Error('Expected ' + JSON.stringify(__e) + ' got ' + JSON.stringify(__r)); }`;
        }
        return line;
      })
      .join('\n');

    // Create function with imports in scope
    const fn = new Function('parse', 'serialize', 'equal', 'get', 'zilde', '_ns', testCode);
    fn(parse, serialize, equal, get, zilde, _ns);

    console.log(`✓ Block ${i + 1}: ${preview}`);
    passed++;
  } catch (e) {
    console.log(`✗ Block ${i + 1}: ${preview}`);
    console.log(`  Error: ${e.message}`);
    console.log(`  Code:\n${code.split('\n').map(l => '    ' + l).join('\n')}`);
    failed++;
  }
}

console.log(`\n=== Summary ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
