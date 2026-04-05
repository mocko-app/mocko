import type { Mock } from "@/lib/types/mock";
import type { Store } from "@/lib/store/store";

export class MemoryStore implements Store {
  private readonly mocks = new Map<string, Mock>();

  async listMocks(): Promise<Mock[]> {
    return Array.from(this.mocks.values());
  }

  async getMock(id: string): Promise<Mock | null> {
    return this.mocks.get(id) ?? null;
  }

  async saveMock(id: string, mock: Mock): Promise<void> {
    this.mocks.set(id, mock);
  }

  async deleteMock(id: string): Promise<void> {
    this.mocks.delete(id);
  }

  async health(): Promise<void> {
    return Promise.resolve();
  }
}
