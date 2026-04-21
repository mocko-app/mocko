/**
 * Extracts placeholder names from a Mocko flag key pattern.
 *
 * @example
 * type Params = ExtractParams<'users:{id}:preferences:{preference}'>;
 * // Params is ['id', 'preference']
 */
export type ExtractParams<S extends string> =
  S extends `${string}{${infer Param}}${infer Rest}`
    ? [Param, ...ExtractParams<Rest>]
    : [];

/**
 * Maps extracted placeholder names to the string values used to resolve a flag
 * key.
 */
export type ParamsRecord<TParams extends readonly string[]> = {
  [Param in TParams[number]]: string;
};
