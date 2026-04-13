import { toReadOnlyDetailsMock, toReadOnlyMock } from "@/lib/mock/mock.mapper";
import { CoreClient } from "@/lib/store/core-client";
import type { FlagKey } from "@/lib/types/flag";
import type { Host } from "@/lib/types/host";
import type { MockFailure } from "@/lib/types/mock-dtos";
import type { Mock, MockAnnotation, MockResponse } from "@/lib/types/mock";
import type {
  CreateHostInput,
  PatchHostInput,
} from "@/lib/validation/host.schema";
import type {
  CreateMockInput,
  PatchMockInput,
} from "@/lib/validation/mock.schema";

export type StoreFlag = {
  key: string;
  value: string;
};

export type FlagListResult = {
  flagKeys: FlagKey[];
  isTruncated: boolean;
};

export type CreateHostData = CreateHostInput;
export type UpdateHostData = PatchHostInput;

export abstract class Store {
  constructor(protected readonly coreClient: CoreClient) {}

  async listMocks(): Promise<Mock[]> {
    return [
      ...(await this.listOwnMocks()),
      ...(await this.listReadOnlyMocks()),
    ];
  }

  async getMock(id: string): Promise<Mock | null> {
    const mock = await this.getOwnMock(id);
    if (mock) {
      return mock;
    }

    return await this.getReadOnlyMock(id);
  }

  async createMock(data: CreateMockInput): Promise<Mock> {
    const mock = this.buildCreatedMock(data);

    await this.saveCreatedMock(mock);
    return mock;
  }

  async updateMock(id: string, data: PatchMockInput): Promise<Mock | null> {
    const current = await this.getOwnMock(id);
    if (!current) {
      return null;
    }

    let nextHost = current.host;
    if (data.host !== undefined) {
      nextHost = data.host ?? undefined;
    }

    const next: Mock = {
      ...current,
      name: data.name ?? current.name,
      method: data.method ?? current.method,
      path: data.path ?? current.path,
      host: nextHost,
      isEnabled: data.isEnabled ?? current.isEnabled,
      labels: data.labels ?? current.labels,
      response: data.response
        ? this.mergeResponse(current.response, data.response)
        : current.response,
      annotations: [...current.annotations],
    };

    await this.saveUpdatedMock(id, next);
    return next;
  }

  async listHosts(): Promise<Host[]> {
    const ownHosts = await this.listOwnHosts();
    const ownSlugs = new Set(ownHosts.map((host) => host.slug));

    return [
      ...ownHosts,
      ...(await this.listReadOnlyHosts()).filter(
        (host) => !ownSlugs.has(host.slug),
      ),
    ];
  }

  async getHost(slug: string): Promise<Host | null> {
    const host = await this.getOwnHost(slug);
    if (host) {
      return host;
    }

    const readOnlyHosts = await this.listReadOnlyHosts();
    return readOnlyHosts.find((item) => item.slug === slug) ?? null;
  }

  async createHost(data: CreateHostData): Promise<Host> {
    const host = this.buildCreatedHost(data);
    await this.saveCreatedHost(host);
    return host;
  }

  async updateHost(slug: string, data: UpdateHostData): Promise<Host | null> {
    const current = await this.getOwnHost(slug);
    if (!current) {
      return null;
    }

    const next: Host = {
      ...current,
      name: data.name ?? current.name,
      source: data.source ?? current.source,
      destination: data.destination ?? current.destination,
      annotations: [...current.annotations],
    };

    await this.saveUpdatedHost(slug, next);
    return next;
  }

  abstract deleteMock(id: string): Promise<boolean>;
  abstract listFlags(prefix: string): Promise<FlagListResult>;
  abstract getFlag(key: string): Promise<StoreFlag | null>;
  abstract setFlag(key: string, value: string): Promise<StoreFlag>;
  abstract deleteFlag(key: string): Promise<boolean>;
  abstract deleteHost(slug: string): Promise<boolean>;
  abstract deploy(): Promise<void>;
  abstract getFailure(mockId: string): Promise<MockFailure | null>;
  abstract health(): Promise<void>;

  protected abstract listOwnMocks(): Promise<Mock[]>;
  protected abstract getOwnMock(id: string): Promise<Mock | null>;
  protected abstract saveCreatedMock(mock: Mock): Promise<void>;
  protected abstract saveUpdatedMock(id: string, mock: Mock): Promise<void>;
  protected abstract listOwnHosts(): Promise<Host[]>;
  protected abstract getOwnHost(slug: string): Promise<Host | null>;
  protected abstract saveCreatedHost(host: Host): Promise<void>;
  protected abstract saveUpdatedHost(slug: string, host: Host): Promise<void>;
  protected abstract getCreatedAnnotations(): MockAnnotation[];

  protected async listReadOnlyMocks(): Promise<Mock[]> {
    try {
      const coreMocks = await this.coreClient.listCoreMocks();
      return coreMocks
        .filter((mock) => mock.source === "FILE")
        .map(toReadOnlyMock);
    } catch (error) {
      console.error("Failed to fetch file-based mocks from mocko-core:", error);
      return [];
    }
  }

  protected async getReadOnlyMock(id: string): Promise<Mock | null> {
    try {
      const coreMock = await this.coreClient.getCoreMock(id);
      if (!coreMock || coreMock.source !== "FILE") {
        return null;
      }

      return toReadOnlyDetailsMock(coreMock);
    } catch {
      return null;
    }
  }

  protected async listReadOnlyHosts(): Promise<Host[]> {
    try {
      const coreHosts = await this.coreClient.listCoreHosts();
      return coreHosts.map((host) => ({
        slug: host.slug,
        name: host.name,
        source: host.source,
        destination: host.destination,
        annotations: ["READ_ONLY"],
      }));
    } catch (error) {
      console.error("Failed to fetch file-based hosts from mocko-core:", error);
      return [];
    }
  }

  protected buildCreatedMock(data: CreateMockInput): Mock {
    return {
      id: crypto.randomUUID(),
      name: data.name,
      method: data.method,
      path: data.path,
      host: data.host || undefined,
      response: {
        code: data.response.code,
        body: data.response.body,
        headers: { ...data.response.headers },
      },
      isEnabled: true,
      labels: [...(data.labels ?? [])],
      annotations: this.getCreatedAnnotations(),
    };
  }

  protected buildCreatedHost(data: CreateHostData): Host {
    return {
      slug: data.slug,
      name: data.name,
      source: data.source,
      destination: data.destination,
      annotations: this.getCreatedAnnotations(),
    };
  }

  protected mergeResponse(
    currentResponse: MockResponse,
    patchResponse: Partial<MockResponse>,
  ): MockResponse {
    return {
      code: patchResponse.code ?? currentResponse.code,
      body:
        patchResponse.body === undefined
          ? currentResponse.body
          : patchResponse.body,
      headers:
        patchResponse.headers === undefined
          ? { ...currentResponse.headers }
          : { ...patchResponse.headers },
    };
  }
}
