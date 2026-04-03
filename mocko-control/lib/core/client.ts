import axios, { AxiosError, AxiosResponse } from "axios";
import { tryCatch } from "@/lib/http";
import type {
  CoreDeployDefinition,
  CoreMockDetailsDto,
  CoreMockDto,
} from "@/lib/core/data/core.dto";

const MOCKO_CORE_URL = process.env["MOCKO_CORE_URL"]?.replace(/\/+$/, "");
const MOCKO_DEPLOY_SECRET = process.env["MOCKO_DEPLOY_SECRET"];

export class CoreClient {
  private http = axios.create({
    baseURL: MOCKO_CORE_URL,
    headers: {
      Authorization: `Bearer ${MOCKO_DEPLOY_SECRET ?? ""}`,
    },
  });

  async deploy(definition: CoreDeployDefinition): Promise<void> {
    if (!MOCKO_CORE_URL || !MOCKO_DEPLOY_SECRET) {
      throw new Error("Missing MOCKO_CORE_URL or MOCKO_DEPLOY_SECRET");
    }

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
}

export const coreClient = new CoreClient();
