import { FlagDefBuilderImpl } from './flags/runtime-flag-def';
import type { FlagDefBuilder } from './flags/flag-def';
import { MockoTransport } from './transport';

/**
 * Configuration for {@link MockoClient}.
 */
export type MockoClientOptions = {
  /**
   * Default time to live for flags written through this client, in seconds.
   *
   * Defaults to 300 seconds.
   *
   * Individual typed flag definitions may override this with `.ttl(...)`, and
   * raw `setFlag(...)` calls may override it with their optional `ttl`
   * argument.
   */
  defaultFlagTtl?: number;
  /**
   * Internal transport override.
   *
   * @internal
   */
  transport?: MockoTransport;
};

/**
 * Client for interacting with a running Mocko instance from TypeScript tests.
 *
 * Provide an explicit Mocko base URL and export a singleton from your test
 * setup file.
 *
 * @example
 * const mocko = new MockoClient('http://localhost:8080', {
 *   defaultFlagTtl: 300,
 * });
 */
export class MockoClient {
  private readonly defaultFlagTtl: number;
  private readonly transport: MockoTransport;

  /**
   * Creates a Mocko client for a single Mocko instance.
   */
  constructor(baseUrl: string, options: MockoClientOptions = {}) {
    this.defaultFlagTtl = options.defaultFlagTtl ?? 300;
    this.transport = options.transport ?? new MockoTransport(baseUrl);
  }

  /**
   * Reads a raw flag value by its exact key.
   *
   * Prefer {@link defineFlag} for typed flag definitions reused across tests.
   * Returns `undefined` when the flag is not set.
   */
  async getFlag<TValue = unknown>(key: string): Promise<TValue | undefined> {
    return await this.transport.getFlag<TValue>(key);
  }

  /**
   * Writes a raw flag value by its exact key.
   *
   * Prefer {@link defineFlag} for typed flag definitions reused across tests.
   * The optional `ttl` overrides `defaultFlagTtl` for this write, in seconds.
   */
  async setFlag<TValue>(
    key: string,
    value: TValue,
    ttl?: number,
  ): Promise<void> {
    await this.transport.setFlag(key, value, ttl ?? this.defaultFlagTtl);
  }

  /**
   * Deletes a raw flag by its exact key.
   *
   * Prefer {@link defineFlag} for typed flag definitions reused across tests.
   */
  async deleteFlag(key: string): Promise<void> {
    await this.transport.deleteFlag(key);
  }

  /**
   * Defines a typed flag that can be reused across tests.
   *
   * The description is shown in errors to make failures easier to understand.
   */
  defineFlag<TValue>(description: string): FlagDefBuilder<TValue> {
    return new FlagDefBuilderImpl<TValue>(this, description);
  }
}
