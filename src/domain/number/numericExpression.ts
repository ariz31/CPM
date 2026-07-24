export class NumericExpressionError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'NumericExpressionError';
  }
}

const MAX_EXPRESSION_LENGTH = 160;

export function evaluateNumericExpression(rawExpression: string): number {
  const expression = normalizeExpression(rawExpression);
  if (!expression) throw new NumericExpressionError('Enter a number or calculation.');
  if (expression.length > MAX_EXPRESSION_LENGTH) throw new NumericExpressionError('The calculation is too long.');

  const parser = new NumericExpressionParser(expression);
  const result = parser.parse();
  if (!Number.isFinite(result)) throw new NumericExpressionError('The calculation does not produce a finite number.');
  return result;
}

export function formatNumericResult(value: number): string {
  if (!Number.isFinite(value)) throw new NumericExpressionError('The value must be finite.');
  if (Object.is(value, -0)) return '0';
  if (Number.isInteger(value)) return String(value);
  return Number(value.toPrecision(12)).toString();
}

function normalizeExpression(value: string): string {
  return value
    .trim()
    .replace(/[−–—]/g, '-')
    .replace(/[×xX]/g, '*')
    .replace(/÷/g, '/')
    .replace(/％/g, '%')
    .replace(/,/g, '');
}

class NumericExpressionParser {
  private index = 0;

  public constructor(private readonly source: string) {}

  public parse(): number {
    const value = this.parseExpression();
    this.skipWhitespace();
    if (this.index !== this.source.length) {
      throw new NumericExpressionError(`Unexpected character “${this.source[this.index]}”.`);
    }
    return value;
  }

  private parseExpression(): number {
    let value = this.parseTerm();
    while (true) {
      this.skipWhitespace();
      if (this.consume('+')) value += this.parseTerm();
      else if (this.consume('-')) value -= this.parseTerm();
      else return value;
    }
  }

  private parseTerm(): number {
    let value = this.parsePower();
    while (true) {
      this.skipWhitespace();
      if (this.consume('*')) value *= this.parsePower();
      else if (this.consume('/')) {
        const divisor = this.parsePower();
        if (divisor === 0) throw new NumericExpressionError('Division by zero is not allowed.');
        value /= divisor;
      } else return value;
    }
  }

  private parsePower(): number {
    const base = this.parseUnary();
    this.skipWhitespace();
    if (!this.consume('^')) return base;
    return base ** this.parsePower();
  }

  private parseUnary(): number {
    this.skipWhitespace();
    if (this.consume('+')) return this.parseUnary();
    if (this.consume('-')) return -this.parseUnary();
    return this.parsePostfix();
  }

  private parsePostfix(): number {
    let value = this.parsePrimary();
    this.skipWhitespace();
    while (this.consume('%')) {
      value /= 100;
      this.skipWhitespace();
    }
    return value;
  }

  private parsePrimary(): number {
    this.skipWhitespace();
    if (this.consume('(')) {
      const value = this.parseExpression();
      this.skipWhitespace();
      if (!this.consume(')')) throw new NumericExpressionError('A closing parenthesis is missing.');
      return value;
    }
    return this.parseNumber();
  }

  private parseNumber(): number {
    this.skipWhitespace();
    const start = this.index;
    let hasDigit = false;

    while (this.isDigit(this.peek())) {
      hasDigit = true;
      this.index += 1;
    }
    if (this.peek() === '.') {
      this.index += 1;
      while (this.isDigit(this.peek())) {
        hasDigit = true;
        this.index += 1;
      }
    }
    if (!hasDigit) throw new NumericExpressionError('A number is expected.');

    if (this.peek()?.toLowerCase() === 'e') {
      const exponentStart = this.index;
      this.index += 1;
      if (this.peek() === '+' || this.peek() === '-') this.index += 1;
      const digitsStart = this.index;
      while (this.isDigit(this.peek())) this.index += 1;
      if (digitsStart === this.index) this.index = exponentStart;
    }

    const value = Number(this.source.slice(start, this.index));
    if (!Number.isFinite(value)) throw new NumericExpressionError('The number is outside the supported range.');
    return value;
  }

  private skipWhitespace(): void {
    while (/\s/.test(this.peek() ?? '')) this.index += 1;
  }

  private consume(character: string): boolean {
    if (this.source[this.index] !== character) return false;
    this.index += 1;
    return true;
  }

  private peek(): string | undefined {
    return this.source[this.index];
  }

  private isDigit(value: string | undefined): boolean {
    return value !== undefined && value >= '0' && value <= '9';
  }
}
