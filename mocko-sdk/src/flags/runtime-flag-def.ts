import type { FlagDef, FlagDefBuilder } from './flag-def';
import type { MockoClient } from '../client';

export class FlagDefBuilderImpl<TValue> implements FlagDefBuilder<TValue> {
  constructor(
    private readonly client: MockoClient,
    private readonly description: string,
  ) {}

  pattern(pattern: string): RuntimeFlagDef<TValue>;
  pattern<TPattern extends string>(
    pattern: TPattern,
  ): FlagDef<TValue, TPattern> {
    validatePattern(this.description, pattern);
    return new RuntimeFlagDef<TValue>(this.client, this.description, pattern);
  }
}

class RuntimeFlagDef<TValue> {
  private readonly params: string[];

  constructor(
    private readonly client: MockoClient,
    private readonly description: string,
    private readonly pattern: string,
    private readonly flagTtl?: number,
  ) {
    this.params = extractParams(pattern);
  }

  async get(...args: unknown[]): Promise<TValue | undefined> {
    return await this.client.getFlag<TValue>(this.keyFromArgs(args));
  }

  async set(...args: unknown[]): Promise<void> {
    const value = args[args.length - 1] as TValue;
    const keyArgs = args.slice(0, -1);

    await this.client.setFlag(this.keyFromArgs(keyArgs), value, this.flagTtl);
  }

  async delete(...args: unknown[]): Promise<void> {
    await this.client.deleteFlag(this.keyFromArgs(args));
  }

  key(...args: unknown[]): string {
    return this.keyFromArgs(args);
  }

  ttl(ttl: number): RuntimeFlagDef<TValue> {
    return new RuntimeFlagDef<TValue>(
      this.client,
      this.description,
      this.pattern,
      ttl,
    );
  }

  private keyFromArgs(args: unknown[]): string {
    if (this.params.length === 0) {
      this.assertArgCount(args, 0);
      return this.pattern;
    }

    if (this.params.length === 1) {
      return this.keyFromOneArg(args);
    }

    return this.keyFromManyArgs(args);
  }

  private keyFromOneArg(args: unknown[]): string {
    this.assertArgCount(args, 1);
    const [value] = args;
    if (typeof value !== 'string') {
      throw this.usageError('expected one string parameter');
    }

    return this.replaceParams({
      [this.params[0]]: value,
    });
  }

  private keyFromManyArgs(args: unknown[]): string {
    this.assertArgCount(args, 1);
    const [params] = args;
    if (!isParamsObject(params)) {
      throw this.usageError('expected one params object');
    }

    const values: Record<string, string> = {};
    for (const param of this.params) {
      const value = params[param];
      if (typeof value !== 'string') {
        throw this.usageError(`missing string parameter "${param}"`);
      }

      values[param] = value;
    }

    return this.replaceParams(values);
  }

  private replaceParams(values: Record<string, string>): string {
    return this.pattern.replace(/\{([^{}]+)\}/g, (_, param: string) => {
      return values[param];
    });
  }

  private assertArgCount(args: unknown[], expected: number): void {
    if (args.length !== expected) {
      throw this.usageError(`expected ${expected} parameter(s)`);
    }
  }

  private usageError(message: string): Error {
    return new Error(`Mocko flag "${this.description}" ${message}`);
  }
}

function extractParams(pattern: string): string[] {
  return Array.from(pattern.matchAll(/\{([^{}]+)\}/g), ([, param]) => param);
}

function isParamsObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validatePattern(description: string, pattern: string): void {
  if (!pattern.trim()) {
    throw patternError(description, 'pattern is required');
  }

  if (
    pattern.startsWith(':') ||
    pattern.endsWith(':') ||
    pattern.includes('::')
  ) {
    throw patternError(
      description,
      "pattern cannot start or end with ':' or contain empty sections like '::'",
    );
  }

  if (pattern.includes('{}')) {
    throw patternError(description, 'pattern placeholders must be named');
  }
}

function patternError(description: string, message: string): Error {
  return new Error(`Mocko flag "${description}" ${message}`);
}
