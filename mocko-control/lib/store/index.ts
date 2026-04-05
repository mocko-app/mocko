import { MemoryStore } from "@/lib/store/memory-store";
import type { Store } from "@/lib/store/store";

declare global {
  var __mockoStore: Store | undefined;
}

export function getStore(): Store {
  if (!globalThis.__mockoStore) {
    globalThis.__mockoStore = new MemoryStore();
  }

  return globalThis.__mockoStore;
}
