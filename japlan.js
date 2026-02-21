/**
 * japlan - JavaScript parser/serializer for Dyalog APL Array Notation (APLAN)
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

// Zilde sentinel - empty array with marker property (frozen since it's immutably empty)
const zilde = [];
zilde._isZilde = true;
Object.freeze(zilde);

// Namespace marker - Symbol avoids collision with user keys and doesn't appear in Object.keys()
const _ns = Symbol.for('aplan.namespace');

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
 * - Matrices: nested arrays with _shape property
 * - Namespaces: objects with _ns Symbol property
 * - Zilde: frozen empty array with _isZilde property
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
      return zilde;
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
      const ns = {};
      ns[_ns] = true;
      return ns;
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
    const ns = {};
    ns[_ns] = true;

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
      const result = [];
      result._shape = [0];
      return result;
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
 * Returns nested array with _shape property
 */
function rowsToMatrix(rows) {
  if (rows.length === 0) {
    const result = [];
    result._shape = [0];
    return result;
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

  // Build nested array structure
  const cellSize = maxShape.reduce((a, b) => a * b, 1);
  const result = [];

  for (const row of rows) {
    const flat = flatten(row);
    // Pad with zeros if needed
    while (flat.length < cellSize) {
      flat.push(0);
    }
    // If row shape is 1D, keep as flat array; otherwise nest
    if (maxShape.length === 1) {
      result.push(flat);
    } else {
      result.push(rebuildNested(flat, maxShape));
    }
  }

  result._shape = [rows.length, ...maxShape];
  return result;
}

/**
 * Rebuild a flat array into nested structure based on shape
 */
function rebuildNested(flat, shape) {
  if (shape.length === 1) {
    return flat.slice(0, shape[0]);
  }

  const result = [];
  const subShape = shape.slice(1);
  const subSize = subShape.reduce((a, b) => a * b, 1);

  for (let i = 0; i < shape[0]; i++) {
    const subFlat = flat.slice(i * subSize, (i + 1) * subSize);
    if (subShape.length === 1) {
      result.push(subFlat);
    } else {
      result.push(rebuildNested(subFlat, subShape));
    }
  }

  return result;
}

/**
 * Get the shape of a value
 */
function getShape(value) {
  if (value === null || value === undefined) return [];
  if (typeof value === 'number' || typeof value === 'string') return [];
  if (typeof value === 'object' && value.re !== undefined) return []; // Complex
  if (Array.isArray(value)) {
    if (value._shape) return value._shape;
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

    // Zilde sentinel (check both identity and property)
    if (value === zilde || (Array.isArray(value) && value._isZilde)) {
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

    // Matrix (array with _shape property)
    if (Array.isArray(value) && value._shape) {
      return this.serializeMatrix(value, depth);
    }

    // Namespace
    if (value[_ns]) {
      return this.serializeNamespace(value, depth);
    }

    // Array (vector)
    if (Array.isArray(value)) {
      return this.serializeVector(value, depth);
    }

    // Object without marker - treat as namespace
    if (typeof value === 'object') {
      const ns = { ...value };
      ns[_ns] = true;
      return this.serializeNamespace(ns, depth);
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
    const shape = m._shape;

    if (shape.length === 0 || shape[0] === 0) {
      return '[]';
    }

    const rows = [];

    for (let i = 0; i < m.length; i++) {
      const rowData = flatten(m[i]);

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
    const entries = Object.entries(ns);

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
 * Get element from array by index
 * Works with nested arrays and matrix objects
 * @param {any} value - Array or matrix to index into
 * @param {number|number[]} index - Single index or array of indices
 * @returns {any} The element at the given index
 */
function get(value, index) {
  // Normalize index to array
  const indices = Array.isArray(index) ? index : [index];

  // Handle zilde
  if (value === zilde) {
    throw new Error('Cannot index into zilde (empty array)');
  }

  // Handle matrix objects (arrays with _shape) - just use nested indexing
  if (Array.isArray(value) && value._shape) {
    const shape = value._shape;

    if (indices.length !== shape.length) {
      throw new Error(`Index rank ${indices.length} does not match array rank ${shape.length}`);
    }

    // Just traverse the nested array
    let current = value;
    for (let i = 0; i < indices.length; i++) {
      if (indices[i] < 0 || indices[i] >= shape[i]) {
        throw new Error(`Index ${indices[i]} out of bounds for dimension ${i} with size ${shape[i]}`);
      }
      current = current[indices[i]];
    }

    return current;
  }

  // Handle nested arrays
  if (Array.isArray(value)) {
    let current = value;
    for (let i = 0; i < indices.length; i++) {
      if (!Array.isArray(current)) {
        throw new Error(`Cannot index deeper: reached non-array at depth ${i}`);
      }
      if (indices[i] < 0 || indices[i] >= current.length) {
        throw new Error(`Index ${indices[i]} out of bounds for array of length ${current.length}`);
      }
      current = current[indices[i]];
    }
    return current;
  }

  throw new Error(`Cannot index into value of type ${typeof value}`);
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

  // Zilde equals empty array (check identity or _isZilde property)
  const aIsZilde = a === zilde || (Array.isArray(a) && a._isZilde);
  const bIsZilde = b === zilde || (Array.isArray(b) && b._isZilde);
  if ((aIsZilde && Array.isArray(b) && b.length === 0) ||
      (bIsZilde && Array.isArray(a) && a.length === 0)) {
    return true;
  }

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

    // Matrices (arrays with _shape)
    if (Array.isArray(a) && a._shape && Array.isArray(b) && b._shape) {
      return equal(a._shape, b._shape) && equal([...a], [...b]);
    }

    // Objects/Namespaces
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(k => equal(a[k], b[k]));
  }

  return false;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parse, serialize, equal, get, zilde, _ns, Tokenizer, Parser, Serializer };
}

// Export for ES modules
export { parse, serialize, equal, get, zilde, _ns, Tokenizer, Parser, Serializer };
