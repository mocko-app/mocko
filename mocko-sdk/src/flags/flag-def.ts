import type { ExtractParams, ParamsRecord } from './types';

/**
 * Builder returned by {@link MockoClient.defineFlag}.
 *
 * Call {@link FlagDefBuilder.pattern} before using the flag so Mocko can build
 * the final key from your static and dynamic key parts.
 */
export type FlagDefBuilder<TValue> = {
  /**
   * Defines the Mocko flag key pattern.
   *
   * Use `{paramName}` placeholders for dynamic key parts. The number of
   * placeholders controls the argument shape of the returned flag definition.
   *
   * @example
   * const userPreference = mocko
   *   .defineFlag<string>('User preference')
   *   .pattern('users:{id}:preferences:{preference}');
   */
  pattern<TPattern extends string>(
    pattern: TPattern,
  ): FlagDef<TValue, TPattern>;
};

/**
 * Typed flag definition for patterns without placeholders.
 */
export type ZeroParamFlagDef<TValue> = {
  /**
   * Reads the current flag value, or `undefined` when the flag is not set.
   */
  get(): Promise<TValue | undefined>;

  /**
   * Writes the flag value.
   */
  set(value: TValue): Promise<void>;

  /**
   * Deletes the flag.
   */
  delete(): Promise<void>;

  /**
   * Returns the resolved Mocko flag key.
   */
  key(): string;

  /**
   * Overrides this flag's time to live, in seconds.
   */
  ttl(ttl: number): ZeroParamFlagDef<TValue>;
};

/**
 * Typed flag definition for patterns with exactly one placeholder.
 */
export type OneParamFlagDef<TValue> = {
  /**
   * Reads the current flag value, or `undefined` when the flag is not set.
   */
  get(param: string): Promise<TValue | undefined>;

  /**
   * Writes the flag value.
   */
  set(param: string, value: TValue): Promise<void>;

  /**
   * Deletes the flag.
   */
  delete(param: string): Promise<void>;

  /**
   * Returns the resolved Mocko flag key.
   */
  key(param: string): string;

  /**
   * Overrides this flag's time to live, in seconds.
   */
  ttl(ttl: number): OneParamFlagDef<TValue>;
};

/**
 * Typed flag definition for patterns with two or more placeholders.
 */
export type MultiParamFlagDef<TValue, TPattern extends string> = {
  /**
   * Reads the current flag value, or `undefined` when the flag is not set.
   */
  get(
    params: ParamsRecord<ExtractParams<TPattern>>,
  ): Promise<TValue | undefined>;

  /**
   * Writes the flag value.
   */
  set(
    params: ParamsRecord<ExtractParams<TPattern>>,
    value: TValue,
  ): Promise<void>;

  /**
   * Deletes the flag.
   */
  delete(params: ParamsRecord<ExtractParams<TPattern>>): Promise<void>;

  /**
   * Returns the resolved Mocko flag key.
   */
  key(params: ParamsRecord<ExtractParams<TPattern>>): string;

  /**
   * Overrides this flag's time to live, in seconds.
   */
  ttl(ttl: number): MultiParamFlagDef<TValue, TPattern>;
};

/**
 * Resolves a flag pattern into the right typed flag definition.
 *
 * Patterns with no placeholders use no key arguments. Patterns with one
 * placeholder use a single positional string. Patterns with two or more
 * placeholders use a named params object.
 */
export type FlagDef<TValue, TPattern extends string> =
  ExtractParams<TPattern> extends []
    ? ZeroParamFlagDef<TValue>
    : ExtractParams<TPattern> extends [string]
      ? OneParamFlagDef<TValue>
      : MultiParamFlagDef<TValue, TPattern>;
