/**
 * APLAN - JavaScript parser/serializer for Dyalog APL Array Notation
 *
 * Array Notation is a literal syntax for APL arrays:
 * - Vectors: (a ⋄ b ⋄ c) or (a\nb\nc)
 * - Matrices: [a ⋄ b ⋄ c] - elements become major cells
 * - Namespaces: (name: value ⋄ name2: value2)
 * - Numbers: 42, ¯5, 3.14, 1E5, 3J4 (complex)
 * - Strings: 'text' with '' for literal quote
 * - Zilde: ⍬ (empty numeric vector)
 */

// Token types
const TokenType = {
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  ZILDE: 'ZILDE',
  NAME: 'NAME',
  COLON: 'COLON',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  LBRACKET: 'LBRACKET',
  RBRACKET: 'RBRACKET',
  SEPARATOR: 'SEPARATOR',  // ⋄ or newline
  WHITESPACE: 'WHITESPACE',
  EOF: 'EOF',
};

// High minus for negative numbers
const HIGH_MINUS = '¯';
const DIAMOND = '⋄';
const ZILDE = '⍬';

// Separators: diamond, LF, CR, NEL
const SEPARATORS = new Set([DIAMOND, '\n', '\r', '\x85']);

// APL identifier start characters (simplified - covers common cases)
const isNameStart = (ch) => /[A-Za-z_∆⍙Ⓐ-Ⓩ]/.test(ch) || (ch >= 'À' && ch <= 'ü');
const isNameChar = (ch) => isNameStart(ch) || /[0-9]/.test(ch);

/**
 * Tokenizer - converts APLAN source to tokens
 */
class Tokenizer {
  constructor(source) {
    this.source = source;
    this.pos = 0;
    this.tokens = [];
  }

  peek(offset = 0) {
    return this.source[this.pos + offset];
  }

  advance() {
    return this.source[this.pos++];
  }

  isAtEnd() {
    return this.pos >= this.source.length;
  }

  skipWhitespace() {
    while (!this.isAtEnd()) {
      const ch = this.peek();
      if (ch === ' ' || ch === '\t') {
        this.advance();
      } else {
        break;
      }
    }
  }

  readString() {
    // Opening quote already consumed
    let value = '';
    while (!this.isAtEnd()) {
      const ch = this.advance();
      if (ch === "'") {
        // Check for escaped quote
        if (this.peek() === "'") {
          value += "'";
          this.advance();
        } else {
          // End of string
          return { type: TokenType.STRING, value };
        }
      } else {
        value += ch;
      }
    }
    throw new Error('Unterminated string');
  }

  readNumber() {
    let numStr = '';

    // Handle negative (high minus)
    if (this.peek() === HIGH_MINUS) {
      numStr += '-';
      this.advance();
    }

    // Read integer part
    while (!this.isAtEnd() && /[0-9]/.test(this.peek())) {
      numStr += this.advance();
    }

    // Decimal part
    if (this.peek() === '.' && /[0-9]/.test(this.peek(1))) {
      numStr += this.advance(); // .
      while (!this.isAtEnd() && /[0-9]/.test(this.peek())) {
        numStr += this.advance();
      }
    }

    // Exponential part
    if (this.peek() === 'E' || this.peek() === 'e') {
      numStr += this.advance();
      if (this.peek() === HIGH_MINUS) {
        numStr += '-';
        this.advance();
      } else if (this.peek() === '-' || this.peek() === '+') {
        numStr += this.advance();
      }
      while (!this.isAtEnd() && /[0-9]/.test(this.peek())) {
        numStr += this.advance();
      }
    }

    // Complex part (J notation)
    if (this.peek() === 'J' || this.peek() === 'j') {
      this.advance();
      let imagStr = '';
      if (this.peek() === HIGH_MINUS) {
        imagStr += '-';
        this.advance();
      }
      while (!this.isAtEnd() && /[0-9.]/.test(this.peek())) {
        imagStr += this.advance();
      }
      // Exponential in imaginary part
      if (this.peek() === 'E' || this.peek() === 'e') {
        imagStr += this.advance();
        if (this.peek() === HIGH_MINUS) {
          imagStr += '-';
          this.advance();
        }
        while (!this.isAtEnd() && /[0-9]/.test(this.peek())) {
          imagStr += this.advance();
        }
      }
      return { type: TokenType.NUMBER, value: { re: parseFloat(numStr), im: parseFloat(imagStr) } };
    }

    return { type: TokenType.NUMBER, value: parseFloat(numStr) };
  }

  readName() {
    let name = '';
    while (!this.isAtEnd() && isNameChar(this.peek())) {
      name += this.advance();
    }
    return { type: TokenType.NAME, value: name };
  }

  tokenize() {
    while (!this.isAtEnd()) {
      this.skipWhitespace();
      if (this.isAtEnd()) break;

      const ch = this.peek();

      // Separators
      if (SEPARATORS.has(ch)) {
        this.advance();
        // Collapse consecutive separators
        while (!this.isAtEnd() && (SEPARATORS.has(this.peek()) || this.peek() === ' ' || this.peek() === '\t')) {
          this.advance();
        }
        this.tokens.push({ type: TokenType.SEPARATOR });
        continue;
      }

      // String
      if (ch === "'") {
        this.advance();
        this.tokens.push(this.readString());
        continue;
      }

      // Number (starts with digit or high minus followed by digit)
      if (/[0-9]/.test(ch) || (ch === HIGH_MINUS && /[0-9]/.test(this.peek(1)))) {
        this.tokens.push(this.readNumber());
        continue;
      }

      // Zilde
      if (ch === ZILDE) {
        this.advance();
        this.tokens.push({ type: TokenType.ZILDE });
        continue;
      }

      // Structural tokens
      if (ch === '(') {
        this.advance();
        this.tokens.push({ type: TokenType.LPAREN });
        continue;
      }
      if (ch === ')') {
        this.advance();
        this.tokens.push({ type: TokenType.RPAREN });
        continue;
      }
      if (ch === '[') {
        this.advance();
        this.tokens.push({ type: TokenType.LBRACKET });
        continue;
      }
      if (ch === ']') {
        this.advance();
        this.tokens.push({ type: TokenType.RBRACKET });
        continue;
      }
      if (ch === ':') {
        this.advance();
        this.tokens.push({ type: TokenType.COLON });
        continue;
      }

      // Name (identifier)
      if (isNameStart(ch)) {
        this.tokens.push(this.readName());
        continue;
      }

      throw new Error(`Unexpected character: '${ch}' (U+${ch.charCodeAt(0).toString(16).toUpperCase()}) at position ${this.pos}`);
    }

    this.tokens.push({ type: TokenType.EOF });
    return this.tokens;
  }
}

/**
 * Parser - converts tokens to JavaScript values
 *
 * Representation:
 * - Scalars: number, string, { re, im } for complex
 * - Vectors: arrays
 * - Matrices: { shape: [rows, cols, ...], data: flat array }
 * - Namespaces: { __aplan_ns__: true, ...properties }
 * - Zilde: { __aplan_zilde__: true } or []
 */
class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek(offset = 0) {
    return this.tokens[this.pos + offset];
  }

  advance() {
    return this.tokens[this.pos++];
  }

  check(type) {
    return this.peek()?.type === type;
  }

  consume(type, message) {
    if (this.check(type)) return this.advance();
    throw new Error(message + ` (got ${this.peek()?.type})`);
  }

  /**
   * Parse the top-level value
   */
  parse() {
    const result = this.parseValue();
    if (!this.check(TokenType.EOF)) {
      throw new Error(`Unexpected token after value: ${this.peek()?.type}`);
    }
    return result;
  }

  /**
   * Parse a value: scalar, vector, matrix, or namespace
   */
  parseValue() {
    // Skip leading separators
    while (this.check(TokenType.SEPARATOR)) {
      this.advance();
    }

    const token = this.peek();

    if (token.type === TokenType.NUMBER) {
      return this.parseStrand();
    }
    if (token.type === TokenType.STRING) {
      return this.parseStrand();
    }
    if (token.type === TokenType.ZILDE) {
      this.advance();
      return [];  // Empty numeric vector
    }
    if (token.type === TokenType.LPAREN) {
      return this.parseParenthesized();
    }
    if (token.type === TokenType.LBRACKET) {
      return this.parseBracketed();
    }
    if (token.type === TokenType.NAME) {
      // Standalone name - this shouldn't happen in pure APLAN
      // but might be part of an APL expression
      this.advance();
      return { __aplan_name__: token.value };
    }

    throw new Error(`Unexpected token: ${token.type}`);
  }

  /**
   * Parse a strand: numbers and/or strings separated by whitespace
   */
  parseStrand() {
    const items = [];

    while (this.check(TokenType.NUMBER) || this.check(TokenType.STRING)) {
      const token = this.advance();
      items.push(token.value);
    }

    // Single item = scalar
    if (items.length === 1) {
      return items[0];
    }
    // Multiple items = vector (strand notation)
    return items;
  }

  /**
   * Parse parenthesized content: vector or namespace
   */
  parseParenthesized() {
    this.consume(TokenType.LPAREN, 'Expected (');

    // Skip leading separators
    let hasLeadingSep = false;
    while (this.check(TokenType.SEPARATOR)) {
      this.advance();
      hasLeadingSep = true;
    }

    // Empty parentheses = empty namespace
    if (this.check(TokenType.RPAREN)) {
      this.advance();
      return { __aplan_ns__: true };
    }

    // Check if this is a namespace (name: value) or vector
    const isNamespace = this.check(TokenType.NAME) && this.peek(1)?.type === TokenType.COLON;

    if (isNamespace) {
      return this.parseNamespace();
    } else {
      return this.parseVector(hasLeadingSep);
    }
  }

  /**
   * Parse a namespace: (name: value ⋄ name2: value2)
   */
  parseNamespace() {
    const ns = { __aplan_ns__: true };

    while (!this.check(TokenType.RPAREN) && !this.check(TokenType.EOF)) {
      // Skip separators
      while (this.check(TokenType.SEPARATOR)) {
        this.advance();
      }
      if (this.check(TokenType.RPAREN)) break;

      const nameToken = this.consume(TokenType.NAME, 'Expected name in namespace');
      this.consume(TokenType.COLON, 'Expected : after name');
      const value = this.parseValue();

      ns[nameToken.value] = value;

      // Skip separators between pairs
      while (this.check(TokenType.SEPARATOR)) {
        this.advance();
      }
    }

    this.consume(TokenType.RPAREN, 'Expected )');
    return ns;
  }

  /**
   * Parse a vector: (a ⋄ b ⋄ c)
   */
  parseVector(hasLeadingSep) {
    const elements = [];
    let hasSeparator = hasLeadingSep;

    while (!this.check(TokenType.RPAREN) && !this.check(TokenType.EOF)) {
      const value = this.parseValue();
      elements.push(value);

      // Check for separator
      if (this.check(TokenType.SEPARATOR)) {
        hasSeparator = true;
        while (this.check(TokenType.SEPARATOR)) {
          this.advance();
        }
      } else if (!this.check(TokenType.RPAREN)) {
        // No separator and not at end - strand continues
      }
    }

    this.consume(TokenType.RPAREN, 'Expected )');

    // If no separator was used and only one element, it's just grouping
    if (!hasSeparator && elements.length === 1) {
      return elements[0];
    }

    return elements;
  }

  /**
   * Parse bracketed content: [a ⋄ b ⋄ c] - creates matrix
   */
  parseBracketed() {
    this.consume(TokenType.LBRACKET, 'Expected [');

    // Skip leading separators
    while (this.check(TokenType.SEPARATOR)) {
      this.advance();
    }

    // Empty brackets
    if (this.check(TokenType.RBRACKET)) {
      this.advance();
      return { __aplan_matrix__: true, shape: [0], data: [] };
    }

    const rows = [];

    while (!this.check(TokenType.RBRACKET) && !this.check(TokenType.EOF)) {
      const row = this.parseValue();
      rows.push(row);

      // Skip separators between rows
      if (this.check(TokenType.SEPARATOR)) {
        while (this.check(TokenType.SEPARATOR)) {
          this.advance();
        }
      }
    }

    this.consume(TokenType.RBRACKET, 'Expected ]');

    // Convert rows to matrix
    return rowsToMatrix(rows);
  }
}

/**
 * Convert array of rows to matrix representation
 * In APLAN, [a ⋄ b ⋄ c] creates a matrix where each element is a major cell
 * Scalars are coerced to 1-element vectors (per APLAN spec)
 */
function rowsToMatrix(rows) {
  if (rows.length === 0) {
    return { __aplan_matrix__: true, shape: [0], data: [] };
  }

  // Determine the shape of each row
  const rowShapes = rows.map(r => getShape(r));

  // Find max shape (for padding)
  // In APLAN brackets, scalars are treated as 1-element vectors
  const maxRank = Math.max(...rowShapes.map(s => s.length === 0 ? 1 : s.length));
  const maxShape = [];
  for (let i = 0; i < maxRank; i++) {
    maxShape.push(Math.max(...rowShapes.map(s => {
      if (s.length === 0) return 1; // Scalar -> 1-element
      return s[i] || 1;
    })));
  }

  // Flatten and pad each row
  const flatData = [];
  const cellSize = maxShape.reduce((a, b) => a * b, 1);

  for (const row of rows) {
    const flat = flatten(row);
    // Pad with zeros if needed
    while (flat.length < cellSize) {
      flat.push(0);
    }
    flatData.push(...flat);
  }

  return {
    __aplan_matrix__: true,
    shape: [rows.length, ...maxShape],
    data: flatData
  };
}

/**
 * Get the shape of a value
 */
function getShape(value) {
  if (value === null || value === undefined) return [];
  if (typeof value === 'number' || typeof value === 'string') return [];
  if (typeof value === 'object' && value.re !== undefined) return []; // Complex
  if (value.__aplan_matrix__) return value.shape;
  if (Array.isArray(value)) {
    if (value.length === 0) return [0];
    // Check if all elements have same shape (for nested arrays)
    return [value.length];
  }
  return [];
}

/**
 * Flatten a value to a 1D array
 */
function flatten(value) {
  if (value === null || value === undefined) return [0];
  if (typeof value === 'number') return [value];
  if (typeof value === 'string') return [value];
  if (typeof value === 'object' && value.re !== undefined) return [value];
  if (value.__aplan_matrix__) return [...value.data];
  if (Array.isArray(value)) {
    const result = [];
    for (const el of value) {
      result.push(...flatten(el));
    }
    return result;
  }
  return [value];
}

/**
 * Serializer - converts JavaScript values to APLAN
 */
class Serializer {
  constructor(options = {}) {
    this.indent = options.indent ?? 1;
    this.useDiamond = options.useDiamond ?? false;
  }

  serialize(value, depth = 0) {
    if (value === null || value === undefined) {
      return '⍬';
    }

    // Complex number
    if (typeof value === 'object' && value.re !== undefined && value.im !== undefined) {
      return this.serializeComplex(value);
    }

    // Number
    if (typeof value === 'number') {
      return this.serializeNumber(value);
    }

    // String
    if (typeof value === 'string') {
      return this.serializeString(value);
    }

    // Matrix
    if (value.__aplan_matrix__) {
      return this.serializeMatrix(value, depth);
    }

    // Namespace
    if (value.__aplan_ns__) {
      return this.serializeNamespace(value, depth);
    }

    // Array (vector)
    if (Array.isArray(value)) {
      return this.serializeVector(value, depth);
    }

    // Object without marker - treat as namespace
    if (typeof value === 'object') {
      return this.serializeNamespace({ __aplan_ns__: true, ...value }, depth);
    }

    throw new Error(`Cannot serialize value: ${typeof value}`);
  }

  serializeNumber(n) {
    if (Object.is(n, -0)) return '0';
    if (!Number.isFinite(n)) {
      throw new Error(`Cannot serialize non-finite number: ${n}`);
    }

    let str = String(n);
    // Replace - with high minus
    str = str.replace(/-/g, HIGH_MINUS);
    // Replace lowercase e with E
    str = str.replace(/e/g, 'E');
    return str;
  }

  serializeComplex(c) {
    const re = this.serializeNumber(c.re);
    const im = this.serializeNumber(c.im);
    return `${re}J${im.replace(HIGH_MINUS, HIGH_MINUS)}`;
  }

  serializeString(s) {
    // Escape single quotes by doubling
    const escaped = s.replace(/'/g, "''");
    return `'${escaped}'`;
  }

  serializeVector(arr, depth) {
    if (arr.length === 0) {
      return '⍬';
    }

    // Check if all elements are numbers (use strand notation)
    if (arr.every(el => typeof el === 'number')) {
      return arr.map(n => this.serializeNumber(n)).join(' ');
    }

    // Use parentheses with separators
    const sep = this.getSeparator(depth);
    const items = arr.map(el => this.serialize(el, depth + 1));

    if (this.useDiamond || items.some(i => i.includes('\n'))) {
      return '(' + items.join(` ${DIAMOND} `) + ')';
    }

    const indent = ' '.repeat(this.indent);
    return '(\n' + items.map(i => indent + i).join('\n') + '\n)';
  }

  serializeMatrix(m, depth) {
    const { shape, data } = m;

    if (shape.length === 0 || shape[0] === 0) {
      return '[]';
    }

    // Calculate row size
    const rowSize = shape.slice(1).reduce((a, b) => a * b, 1);
    const rows = [];

    for (let i = 0; i < shape[0]; i++) {
      const rowData = data.slice(i * rowSize, (i + 1) * rowSize);

      // If row is simple numbers, format as strand
      if (rowData.every(el => typeof el === 'number')) {
        rows.push(rowData.map(n => this.serializeNumber(n)).join(' '));
      } else {
        rows.push(rowData.map(el => this.serialize(el, depth + 1)).join(' '));
      }
    }

    if (this.useDiamond) {
      return '[' + rows.join(` ${DIAMOND} `) + ']';
    }

    const indent = ' '.repeat(this.indent);
    return '[\n' + rows.map(r => indent + r).join('\n') + '\n]';
  }

  serializeNamespace(ns, depth) {
    const entries = Object.entries(ns).filter(([k]) => !k.startsWith('__aplan_'));

    if (entries.length === 0) {
      return '()';
    }

    const items = entries.map(([k, v]) => `${k}: ${this.serialize(v, depth + 1)}`);

    if (this.useDiamond) {
      return '(' + items.join(` ${DIAMOND} `) + ')';
    }

    const indent = ' '.repeat(this.indent);
    return '(\n' + items.map(i => indent + i).join('\n') + '\n)';
  }

  getSeparator(depth) {
    return this.useDiamond ? ` ${DIAMOND} ` : '\n';
  }
}

/**
 * Parse APLAN string to JavaScript value
 */
function parse(source) {
  const tokenizer = new Tokenizer(source);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  return parser.parse();
}

/**
 * Serialize JavaScript value to APLAN string
 */
function serialize(value, options = {}) {
  const serializer = new Serializer(options);
  return serializer.serialize(value);
}

/**
 * Check if two values are equal (for round-trip testing)
 */
function equal(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'number') {
    // Handle NaN
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    return a === b;
  }

  if (typeof a === 'object') {
    if (a === null || b === null) return a === b;

    // Complex numbers
    if (a.re !== undefined && b.re !== undefined) {
      return a.re === b.re && a.im === b.im;
    }

    // Arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((el, i) => equal(el, b[i]));
    }

    // Matrices
    if (a.__aplan_matrix__ && b.__aplan_matrix__) {
      return equal(a.shape, b.shape) && equal(a.data, b.data);
    }

    // Objects/Namespaces
    const keysA = Object.keys(a).filter(k => !k.startsWith('__aplan_'));
    const keysB = Object.keys(b).filter(k => !k.startsWith('__aplan_'));
    if (keysA.length !== keysB.length) return false;
    return keysA.every(k => equal(a[k], b[k]));
  }

  return false;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parse, serialize, equal, Tokenizer, Parser, Serializer };
}

// Export for ES modules
export { parse, serialize, equal, Tokenizer, Parser, Serializer };
