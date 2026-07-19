import { FlagDefBuilderImpl } from './flags/runtime-flag-def';
import type { FlagDefBuilder } from './flags/flag-def';
import type { PendingCallback } from './callbacks/pending-callback';
import { MockoTransport } from './transport';

/**
 * Options for {@link MockoClient.fireCallback}.
 */
export type FireCallbackOptions = {
  /**
   * Milliseconds to wait before delivering instead of firing immediately.
   *
   * The scheduled delivery shows up in {@link MockoClient.listPendingCallbacks}
   * until it fires, and can be fired early with
   * {@link MockoClient.firePendingCallback}.
   */
  delay?: number;
};

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
   * Bearer token for Mocko instances running with MANAGEMENT_AUTH_MODE=all.
   *
   * Not needed for the default MANAGEMENT_AUTH_MODE=deploy mode because flag
   * endpoints are open while the deploy endpoint remains protected.
   */
  secret?: string;
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
 * const mocko = new MockoClient('http://localhost:8080');
 */
export class MockoClient {
  private readonly defaultFlagTtl: number;
  private readonly transport: MockoTransport;

  /**
   * Creates a Mocko client for a single Mocko instance.
   */
  constructor(baseUrl: string, options: MockoClientOptions = {}) {
    this.defaultFlagTtl = options.defaultFlagTtl ?? 300;
    this.transport =
      options.transport ?? new MockoTransport(baseUrl, options.secret);
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

  /**
   * Fires a callback defined in your mocks by its slug.
   *
   * Fires immediately by default; pass `delay` to schedule it instead. The
   * payload is available as `payload` in the callback's templates when it is
   * rendered at delivery time.
   */
  async fireCallback(
    slug: string,
    payload?: unknown,
    options: FireCallbackOptions = {},
  ): Promise<PendingCallback> {
    return await this.transport.fireCallback(slug, payload, options.delay);
  }

  /**
   * Lists scheduled callback deliveries that have not fired yet, ordered by
   * due time.
   */
  async listPendingCallbacks(): Promise<PendingCallback[]> {
    return await this.transport.listPendingCallbacks();
  }

  /**
   * Fires a pending callback immediately, skipping the rest of its delay.
   *
   * Prefer this over waiting in tests that assert on delayed callbacks.
   */
  async firePendingCallback(id: string): Promise<void> {
    await this.transport.firePendingCallback(id);
  }

  /**
   * Cancels a pending callback so it never fires.
   */
  async cancelPendingCallback(id: string): Promise<void> {
    await this.transport.cancelPendingCallback(id);
  }

  /**
   * Cancels all pending callbacks. Useful for isolating tests.
   */
  async clearPendingCallbacks(): Promise<void> {
    await this.transport.clearPendingCallbacks();
  }
}
