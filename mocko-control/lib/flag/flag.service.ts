import { HttpResponseError } from "@/lib/http";
import { getStore } from "@/lib/store";
import type { Store } from "@/lib/store/store";
import { FlagDto, FlagListDto } from "@/lib/types/flag-dtos";
import type { PutFlagInput } from "@/lib/validation/flag.schema";

export class FlagService {
  constructor(private readonly store: Store) {}

  async listFlags(prefix: string, search?: string): Promise<FlagListDto> {
    const list = await this.store.listFlags(prefix, search);
    return new FlagListDto(list.flagKeys, list.isTruncated);
  }

  async getFlag(key: string): Promise<FlagDto> {
    const flag = await this.store.getFlag(key);
    if (!flag) {
      throw HttpResponseError.flagNotFound(key);
    }

    return new FlagDto(flag.value);
  }

  async setFlag(key: string, input: PutFlagInput): Promise<FlagDto> {
    this.assertValueIsValidJson(input.value);
    const flag = await this.store.setFlag(key, input.value);
    return new FlagDto(flag.value);
  }

  async deleteFlag(key: string): Promise<void> {
    await this.store.deleteFlag(key);
  }

  private assertValueIsValidJson(value: string): void {
    try {
      JSON.parse(value);
    } catch {
      throw HttpResponseError.badRequest(
        "Flag value must be valid JSON. If you want to save a string, wrap it in double quotes.",
      );
    }
  }
}

export const flagService = new FlagService(getStore());
