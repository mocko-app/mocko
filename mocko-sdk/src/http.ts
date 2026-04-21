type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type JsonRequestOptions = {
  body?: unknown;
};

export type HttpResponse<TBody> = {
  status: number;
  ok: boolean;
  body: TBody;
};

export class HttpClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async get<TBody>(path: string): Promise<HttpResponse<TBody>> {
    return await this.request<TBody>('GET', path);
  }

  async post<TBody>(
    path: string,
    options: JsonRequestOptions = {},
  ): Promise<HttpResponse<TBody>> {
    return await this.request<TBody>('POST', path, options);
  }

  async put<TBody>(
    path: string,
    options: JsonRequestOptions = {},
  ): Promise<HttpResponse<TBody>> {
    return await this.request<TBody>('PUT', path, options);
  }

  async del<TBody>(path: string): Promise<HttpResponse<TBody>> {
    return await this.request<TBody>('DELETE', path);
  }

  private async request<TBody>(
    method: HttpMethod,
    path: string,
    options: JsonRequestOptions = {},
  ): Promise<HttpResponse<TBody>> {
    const response = await fetch(this.url(path), {
      method,
      headers: this.headers(options),
      body: this.body(options),
    });
    const body = await this.responseBody<TBody>(response);

    return {
      status: response.status,
      ok: response.ok,
      body,
    };
  }

  private url(path: string): string {
    return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private headers(options: JsonRequestOptions): HeadersInit | undefined {
    if (typeof options.body === 'undefined') {
      return undefined;
    }

    return {
      'content-type': 'application/json',
    };
  }

  private body(options: JsonRequestOptions): string | undefined {
    if (typeof options.body === 'undefined') {
      return undefined;
    }

    return JSON.stringify(options.body);
  }

  private async responseBody<TBody>(response: Response): Promise<TBody> {
    if (response.status === 204) {
      return undefined as TBody;
    }

    try {
      return (await response.clone().json()) as TBody;
    } catch (error) {
      const text = await response.text().catch(() => '');
      console.error(
        `Mocko expected JSON but received a non-JSON response from ${response.url || 'the server'}: ${text}`,
      );
      throw error;
    }
  }
}
