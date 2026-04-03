import type { Mock } from "@/lib/types/mock";

export interface Store {
  listMocks(): Promise<Mock[]>;
  getMock(id: string): Promise<Mock | null>;
  saveMock(id: string, mock: Mock): Promise<void>;
  deleteMock(id: string): Promise<void>;
  health(): Promise<void>;
}
