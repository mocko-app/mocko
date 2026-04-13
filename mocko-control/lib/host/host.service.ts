import { HttpResponseError } from "@/lib/http";
import { getStore } from "@/lib/store";
import type { Store } from "@/lib/store/store";
import type { Host } from "@/lib/types/host";
import type {
  CreateHostInput,
  PatchHostInput,
} from "@/lib/validation/host.schema";

export class HostService {
  constructor(private readonly store: Store) {}

  async listHosts(): Promise<Host[]> {
    return this.store.listHosts();
  }

  async getHost(slug: string): Promise<Host> {
    const host = await this.store.getHost(slug);
    if (!host) {
      throw HttpResponseError.hostNotFound(slug);
    }

    return host;
  }

  async createHost(data: CreateHostInput): Promise<Host> {
    const hosts = await this.store.listHosts();
    if (hosts.some((host) => host.slug === data.slug)) {
      throw HttpResponseError.hostSlugConflict(data.slug);
    }

    const host = await this.store.createHost(data);
    await this.store.deploy();
    return host;
  }

  async updateHost(slug: string, data: PatchHostInput): Promise<Host> {
    const host = await this.store.getHost(slug);
    if (!host) {
      throw HttpResponseError.hostNotFound(slug);
    }

    const updatedHost = await this.store.updateHost(slug, data);
    if (!updatedHost) {
      throw HttpResponseError.hostNotFound(slug);
    }

    await this.store.deploy();
    return updatedHost;
  }

  async deleteHost(slug: string): Promise<void> {
    const deleted = await this.store.deleteHost(slug);
    if (!deleted) {
      throw HttpResponseError.hostNotFound(slug);
    }

    await this.store.deploy();
  }
}

export const hostService = new HostService(getStore());
