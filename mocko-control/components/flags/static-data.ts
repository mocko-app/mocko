import { FlagKeyDto, type FlagListDto } from "@/lib/types/flag-dtos";

export const HARDCODED_FLAG_VALUES: Record<string, string> = {
  "session-count": "42",
  "app-version": '"2.1.0"',
  "users:abc-123:balance": "1250.75",
  "users:abc-123:status": '"active"',
  "users:def-456:balance": "0",
  "feature-flags:new-checkout": "true",
  "feature-flags:dark-mode": "false",
};

export const HARDCODED_ITEMS: Record<string, FlagListDto> = {
  "": {
    flagKeys: [
      new FlagKeyDto("PREFIX", "users"),
      new FlagKeyDto("PREFIX", "feature-flags"),
      new FlagKeyDto("FLAG", "session-count"),
      new FlagKeyDto("FLAG", "app-version"),
    ],
    isTruncated: false,
  },
  "users:": {
    flagKeys: [
      new FlagKeyDto("PREFIX", "abc-123"),
      new FlagKeyDto("PREFIX", "def-456"),
    ],
    isTruncated: false,
  },
  "users:abc-123:": {
    flagKeys: [
      new FlagKeyDto("FLAG", "balance"),
      new FlagKeyDto("FLAG", "status"),
    ],
    isTruncated: false,
  },
  "users:def-456:": {
    flagKeys: [new FlagKeyDto("FLAG", "balance")],
    isTruncated: false,
  },
  "feature-flags:": {
    flagKeys: [
      new FlagKeyDto("FLAG", "new-checkout"),
      new FlagKeyDto("FLAG", "dark-mode"),
    ],
    isTruncated: false,
  },
};
