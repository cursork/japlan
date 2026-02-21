#!/usr/bin/env node
/**
 * japlan CLI - convert between APLAN and JSON
 *
 * Usage:
 *   japlan a2j [aplan]     Parse APLAN, output JSON
 *   japlan j2a [json]      Parse JSON, output APLAN
 *   japlan                 Start interactive REPL
 *
 * Input can be provided as argument or piped via stdin.
 */

import { parse, serialize, _ns } from './japlan.js';
import { createInterface } from 'readline';

// Convert plain _ns/_matrix keys for JSON input
function convertNsKeys(value) {
  if (value === null || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map(convertNsKeys);
  }

  // Handle _matrix wrapper → array with _shape
  if (value._matrix && Array.isArray(value._matrix)) {
    const rows = value._matrix.map(convertNsKeys);
    const result = rows;
    const nRows = rows.length;
    const nCols = Array.isArray(rows[0]) ? rows[0].length : 1;
    result._shape = [nRows, nCols];
    return result;
  }

  const result = {};
  for (const [k, v] of Object.entries(value)) {
    if (k === '_ns') {
      result[_ns] = true;
    } else {
      result[k] = convertNsKeys(v);
    }
  }
  if (value._ns) result[_ns] = true;
  return result;
}

function aplanToJson(aplan) {
  const value = parse(aplan);
  return JSON.stringify(value, null, 2);
}

function jsonToAplan(json) {
  const value = JSON.parse(json);
  const converted = convertNsKeys(value);
  return serialize(converted, { useDiamond: true });
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data.trim()));
  });
}

function startRepl() {
  let mode = 'a2j';

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function prompt() {
    rl.setPrompt(`${mode}> `);
    rl.prompt();
  }

  console.log('japlan REPL');
  console.log('.j2a / .a2j to switch mode, .exit to quit\n');
  prompt();

  rl.on('line', (line) => {
    const input = line.trim();

    if (input === '.exit' || input === '.quit') {
      rl.close();
      return;
    }

    if (input === '.a2j') {
      mode = 'a2j';
      prompt();
      return;
    }

    if (input === '.j2a') {
      mode = 'j2a';
      prompt();
      return;
    }

    if (!input) {
      prompt();
      return;
    }

    try {
      if (mode === 'a2j') {
        console.log(aplanToJson(input));
      } else {
        console.log(jsonToAplan(input));
      }
    } catch (e) {
      console.error(`Error: ${e.message}`);
    }

    prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (cmd === 'a2j') {
    const input = args[1] || await readStdin();
    console.log(aplanToJson(input));
  } else if (cmd === 'j2a') {
    const input = args[1] || await readStdin();
    console.log(jsonToAplan(input));
  } else if (!cmd && process.stdin.isTTY) {
    startRepl();
  } else if (!cmd) {
    // Piped input without command - auto-detect
    const input = await readStdin();
    try {
      if (input.startsWith('{') || input.startsWith('[')) {
        console.log(jsonToAplan(input));
      } else {
        console.log(aplanToJson(input));
      }
    } catch (e) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
  } else {
    console.error('Usage: japlan [a2j|j2a] [input]');
    console.error('       japlan              Start REPL');
    process.exit(1);
  }
}

main();
