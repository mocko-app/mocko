import { coreClient } from "@/lib/core/client";
import { HttpResponseError } from "@/lib/http";
import { FlagDto, FlagListDto } from "@/lib/types/flag-dtos";
import type { PutFlagInput } from "@/lib/validation/flag.schema";

export class FlagService {
  async listFlags(prefix: string): Promise<FlagListDto> {
    const list = await coreClient.listCoreFlags(prefix);
    return new FlagListDto(list.flagKeys, list.isTruncated);
  }

  async getFlag(key: string): Promise<FlagDto> {
    const flag = await coreClient.getCoreFlag(key);
    if (!flag) {
      throw HttpResponseError.flagNotFound(key);
    }

    return new FlagDto(flag.value);
  }

  async setFlag(key: string, input: PutFlagInput): Promise<FlagDto> {
    const flag = await coreClient.putCoreFlag(key, { value: input.value });
    return new FlagDto(flag.value);
  }

  async deleteFlag(key: string): Promise<void> {
    await coreClient.deleteCoreFlag(key);
  }
}

export const flagService = new FlagService();
