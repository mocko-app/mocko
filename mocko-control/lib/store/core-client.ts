import axios, { AxiosError, AxiosResponse } from "axios";
import { tryCatch } from "@/lib/http";
import type {
  CoreDeployDefinition,
  CoreFlagDto,
  CoreFlagListDto,
  CoreHostDto,
  CoreMockDetailsDto,
  CoreMockDto,
  CorePutFlagDto,
} from "@/lib/core/data/core.dto";
import { buildFlagListUrl } from "@/lib/flag/flag-list-url";

export class CoreClientHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: object,
  ) {
    super(
      "message" in body && typeof body.message === "string"
        ? body.message
        : `Core request failed with status ${status}`,
    );
    this.name = "CoreClientHttpError";
  }
}

export class CoreClient {
  private readonly http;

  constructor(
    private readonly coreUrl: string,
    private readonly deploySecret: string,
  ) {
    this.http = axios.create({
      baseURL: coreUrl,
      headers: {
        Authorization: `Bearer ${deploySecret}`,
      },
    });
  }

  async deploy(definition: CoreDeployDefinition): Promise<void> {
    this.assertConfigured();
    await this.http.post<unknown>("/__mocko__/deploy", definition);
  }

  async listCoreMocks(): Promise<CoreMockDto[]> {
    const response = await this.http.get<CoreMockDto[]>("/__mocko__/mocks");
    return response.data;
  }

  async getCoreMock(id: string): Promise<CoreMockDetailsDto | null> {
    const [response, error] = await tryCatch<
      AxiosResponse<CoreMockDetailsDto>,
      AxiosError
    >(() => this.http.get<CoreMockDetailsDto>(`/__mocko__/mocks/${id}`));
    if (!response && error?.response?.status === 404) {
      return null;
    }
    if (!response && error) {
      throw error;
    }

    return response.data;
  }

  async listCoreHosts(): Promise<CoreHostDto[]> {
    const response = await this.http.get<CoreHostDto[]>("/__mocko__/hosts");
    return response.data;
  }

  async listCoreFlags(
    prefix: string,
    search?: string,
  ): Promise<CoreFlagListDto> {
    try {
      const response = await this.http.get<CoreFlagListDto>(
        buildFlagListUrl("/__mocko__/flags", prefix, search),
      );
      return response.data;
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async getCoreFlag(key: string): Promise<CoreFlagDto | null> {
    const encodedKey = encodeURIComponent(key);
    const [response, error] = await tryCatch<
      AxiosResponse<CoreFlagDto>,
      AxiosError
    >(() => this.http.get<CoreFlagDto>(`/__mocko__/flags/${encodedKey}`));
    if (!response && error?.response?.status === 404) {
      return null;
    }
    if (!response && error) {
      throw this.mapError(error);
    }

    return response.data;
  }

  async putCoreFlag(
    key: string,
    payload: CorePutFlagDto,
  ): Promise<CoreFlagDto> {
    const encodedKey = encodeURIComponent(key);
    try {
      const response = await this.http.put<CoreFlagDto>(
        `/__mocko__/flags/${encodedKey}`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async deleteCoreFlag(key: string): Promise<void> {
    const encodedKey = encodeURIComponent(key);
    try {
      await this.http.delete(`/__mocko__/flags/${encodedKey}`);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private assertConfigured(): void {
    if (!this.coreUrl || !this.deploySecret) {
      throw new Error("Missing MOCKO_CORE_URL or MOCKO_DEPLOY_SECRET");
    }
  }

  private mapError(error: unknown): Error {
    if (error instanceof AxiosError && error.response) {
      const body = error.response.data;
      if (typeof body === "object" && body !== null) {
        return new CoreClientHttpError(error.response.status, body);
      }
      return new CoreClientHttpError(error.response.status, {
        message: String(
          body ?? `Core request failed (${error.response.status})`,
        ),
      });
    }

    return error instanceof Error
      ? error
      : new Error("Unknown core client error");
  }
}
