import { HttpClient, type HttpResponse } from './http';
import type { PendingCallback } from './callbacks/pending-callback';

type FlagDto = {
  value: string;
};

type FireCallbackPayload = {
  payload?: unknown;
  delay?: number;
};

type SetFlagPayload = {
  value: string;
  source: 'SDK';
  ttl?: number;
};

export class MockoTransport {
  private readonly http: HttpClient;

  constructor(baseUrl: string, secret?: string) {
    const headers: Record<string, string> = {};
    if (secret) {
      headers.Authorization = `Bearer ${secret}`;
    }

    this.http = new HttpClient(baseUrl, {
      headers,
    });
  }

  async getFlag<TValue>(key: string): Promise<TValue | undefined> {
    const response = await this.http.get<FlagDto>(this.flagPath(key));

    if (response.status === 404) {
      return undefined;
    }

    if (!response.ok) {
      throw this.mockoError(response, `get flag "${key}"`);
    }

    return JSON.parse(response.body.value) as TValue;
  }

  async setFlag<TValue>(
    key: string,
    value: TValue,
    ttl: number,
  ): Promise<void> {
    const payload: SetFlagPayload = {
      value: this.serializeValue(value, key),
      source: 'SDK',
      ttl,
    };

    const response = await this.http.put<FlagDto>(this.flagPath(key), {
      body: payload,
    });

    if (!response.ok) {
      throw this.mockoError(response, `set flag "${key}"`);
    }
  }

  async deleteFlag(key: string): Promise<void> {
    const response = await this.http.del<void>(this.flagPath(key));

    if (!response.ok) {
      throw this.mockoError(response, `delete flag "${key}"`);
    }
  }

  async fireCallback(
    slug: string,
    payload: unknown,
    delay?: number,
  ): Promise<PendingCallback> {
    const body: FireCallbackPayload = { payload, delay };
    const response = await this.http.post<PendingCallback>(
      `/__mocko__/callbacks/${encodeURIComponent(slug)}/fire`,
      { body },
    );

    if (!response.ok) {
      throw this.mockoError(response, `fire callback "${slug}"`);
    }

    return response.body;
  }

  async listPendingCallbacks(): Promise<PendingCallback[]> {
    const response = await this.http.get<PendingCallback[]>(
      '/__mocko__/callbacks/pending',
    );

    if (!response.ok) {
      throw this.mockoError(response, 'list pending callbacks');
    }

    return response.body;
  }

  async firePendingCallback(id: string): Promise<void> {
    const response = await this.http.post<void>(this.pendingPath(id) + '/fire');

    if (!response.ok) {
      throw this.mockoError(response, `fire pending callback "${id}"`);
    }
  }

  async cancelPendingCallback(id: string): Promise<void> {
    const response = await this.http.del<void>(this.pendingPath(id));

    if (!response.ok) {
      throw this.mockoError(response, `cancel pending callback "${id}"`);
    }
  }

  async clearPendingCallbacks(): Promise<void> {
    const response = await this.http.del<void>('/__mocko__/callbacks/pending');

    if (!response.ok) {
      throw this.mockoError(response, 'clear pending callbacks');
    }
  }

  private flagPath(key: string): string {
    return `/__mocko__/flags/${encodeURIComponent(key)}`;
  }

  private pendingPath(id: string): string {
    return `/__mocko__/callbacks/pending/${encodeURIComponent(id)}`;
  }

  private serializeValue<TValue>(value: TValue, key: string): string {
    const serialized = JSON.stringify(value);
    if (typeof serialized === 'undefined') {
      throw new Error(`Mocko cannot set flag "${key}" to undefined`);
    }

    return serialized;
  }

  private mockoError(response: HttpResponse<unknown>, action: string): Error {
    return new Error(`Mocko failed to ${action}: HTTP ${response.status}`);
  }
}
