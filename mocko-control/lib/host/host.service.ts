import { isFileDefinition } from "@/lib/conflict/conflicts";
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

  async getHost(id: string): Promise<Host> {
    const host = await this.store.getHost(id);
    if (!host) {
      throw HttpResponseError.hostNotFound(id);
    }

    return host;
  }

  async createHost(data: CreateHostInput): Promise<Host> {
    const hosts = await this.store.listHosts();
    const slug = data.slug.toLowerCase();
    const taken = hosts.some(
      (host) => !isFileDefinition(host) && host.slug.toLowerCase() === slug,
    );
    if (taken) {
      throw HttpResponseError.hostSlugConflict(data.slug);
    }

    const host: Host = {
      id: crypto.randomUUID(),
      slug: data.slug,
      name: data.name,
      source: data.source,
      destination: data.destination,
      annotations: this.store.getCreatedAnnotations(),
    };

    await this.store.saveHost(host);
    await this.store.deploy();
    return host;
  }

  async updateHost(id: string, data: PatchHostInput): Promise<Host> {
    const host = await this.store.getHost(id);
    if (!host) {
      throw HttpResponseError.hostNotFound(id);
    }
    if (host.annotations.includes("READ_ONLY")) {
      throw HttpResponseError.hostReadOnly(id);
    }

    let destination = host.destination;
    if (data.destination !== undefined) {
      destination = data.destination ?? undefined;
    }

    const updatedHost: Host = {
      ...host,
      name: data.name ?? host.name,
      source: data.source ?? host.source,
      destination,
      annotations: [...host.annotations],
    };

    await this.store.saveHost(updatedHost);

    await this.store.deploy();
    return updatedHost;
  }

  async deleteHost(id: string): Promise<void> {
    const deleted = await this.store.deleteHost(id);
    if (!deleted) {
      const host = await this.store.getHost(id);
      if (host?.annotations.includes("READ_ONLY")) {
        throw HttpResponseError.hostReadOnly(id);
      }
      throw HttpResponseError.hostNotFound(id);
    }

    await this.store.deploy();
  }
}

export const hostService = new HostService(getStore());
