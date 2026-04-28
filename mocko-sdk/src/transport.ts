import { HttpClient, type HttpResponse } from './http';

type FlagDto = {
  value: string;
};

type SetFlagPayload = {
  value: string;
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

  private flagPath(key: string): string {
    return `/__mocko__/flags/${encodeURIComponent(key)}`;
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
