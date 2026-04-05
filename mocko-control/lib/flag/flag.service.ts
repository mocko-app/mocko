import { HttpResponseError } from "@/lib/http";
import { FlagDto, FlagKeyDto, FlagListDto } from "@/lib/types/flag-dtos";
import type {
  CreateFlagInput,
  PatchFlagInput,
} from "@/lib/validation/flag.schema";

const DEFAULT_FLAGS_LIST_LIMIT = 200;
const FLAGS_LIST_LIMIT = parseFlagsListLimit();

const INITIAL_FLAGS: Record<string, string> = {
  "session-count": "42",
  "app-version": '"2.1.0"',
  "users:abc-123:balance": "1250.75",
  "users:abc-123:status": '"active"',
  "users:def-456:balance": "0",
  "feature-flags:new-checkout": "true",
  "feature-flags:dark-mode": "false",
};

function parseFlagsListLimit(): number {
  const raw = process.env["MOCKO_FLAGS_LIST_LIMIT"];
  if (!raw) {
    return DEFAULT_FLAGS_LIST_LIMIT;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return DEFAULT_FLAGS_LIST_LIMIT;
  }

  return parsed;
}

function normalizePrefix(prefix: string): string {
  if (!prefix) {
    return "";
  }

  return prefix.endsWith(":") ? prefix : `${prefix}:`;
}

export class FlagService {
  private readonly flags = new Map<string, string>(
    Object.entries(INITIAL_FLAGS),
  );

  async listFlags(prefix: string): Promise<FlagListDto> {
    const normalizedPrefix = normalizePrefix(prefix);
    const groups = new Set<string>();
    const flags: string[] = [];
    let isTruncated = false;

    const keys = Array.from(this.flags.keys()).sort((a, b) =>
      a.localeCompare(b),
    );
    for (const key of keys) {
      if (normalizedPrefix && !key.startsWith(normalizedPrefix)) {
        continue;
      }

      if (groups.size + flags.length >= FLAGS_LIST_LIMIT) {
        isTruncated = true;
        break;
      }

      const relativeKey = normalizedPrefix
        ? key.slice(normalizedPrefix.length)
        : key;

      if (!relativeKey) {
        continue;
      }

      if (relativeKey.includes(":")) {
        groups.add(relativeKey.split(":")[0]);
      } else {
        flags.push(relativeKey);
      }
    }

    return new FlagListDto(
      [
        ...Array.from(groups).map((name) => new FlagKeyDto("PREFIX", name)),
        ...flags.map((name) => new FlagKeyDto("FLAG", name)),
      ],
      isTruncated,
    );
  }

  async getFlag(key: string): Promise<FlagDto> {
    const value = this.flags.get(key);
    if (value === undefined) {
      throw HttpResponseError.flagNotFound(key);
    }

    return new FlagDto(value);
  }

  async createFlag(input: CreateFlagInput): Promise<FlagDto> {
    this.flags.set(input.key, input.value);
    return new FlagDto(input.value);
  }

  async updateFlag(key: string, input: PatchFlagInput): Promise<FlagDto> {
    if (!this.flags.has(key)) {
      throw HttpResponseError.flagNotFound(key);
    }

    this.flags.set(key, input.value);
    return new FlagDto(input.value);
  }

  async deleteFlag(key: string): Promise<void> {
    this.flags.delete(key);
  }
}

declare global {
  var __mockoFlagService: FlagService | undefined;
}

export function getFlagService(): FlagService {
  if (!globalThis.__mockoFlagService) {
    globalThis.__mockoFlagService = new FlagService();
  }

  return globalThis.__mockoFlagService;
}
