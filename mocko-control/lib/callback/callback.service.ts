import { $template } from "bigodon/dist/parser";
import { State } from "pierrejs";
import { HttpResponseError } from "@/lib/http";
import { getStore } from "@/lib/store";
import type { Store } from "@/lib/store/store";
import type { Callback } from "@/lib/types/callback";
import type {
  PendingCallbackDto,
  PendingCallbacksDto,
} from "@/lib/types/callback-dtos";
import type {
  CreateCallbackInput,
  PatchCallbackInput,
} from "@/lib/validation/callback.schema";

export class CallbackService {
  constructor(private readonly store: Store) {}

  async listCallbacks(): Promise<Callback[]> {
    return this.store.listCallbacks();
  }

  async getCallback(slug: string): Promise<Callback> {
    const callback = await this.store.getCallback(slug);
    if (!callback) {
      throw HttpResponseError.callbackNotFound(slug);
    }

    return callback;
  }

  async createCallback(data: CreateCallbackInput): Promise<Callback> {
    const callbacks = await this.store.listCallbacks();
    if (callbacks.some((callback) => callback.slug === data.slug)) {
      throw HttpResponseError.callbackSlugConflict(data.slug);
    }

    const callback: Callback = {
      slug: data.slug,
      ...this.toEditableFields(data),
      annotations: this.store.getCreatedAnnotations(),
    };
    this.assertTemplatesAreValid(callback);

    await this.store.saveCallback(callback);
    await this.store.deploy();
    return callback;
  }

  async updateCallback(
    slug: string,
    data: PatchCallbackInput,
  ): Promise<Callback> {
    const currentCallback = await this.store.getCallback(slug);
    if (!currentCallback) {
      throw HttpResponseError.callbackNotFound(slug);
    }
    if (currentCallback.annotations.includes("READ_ONLY")) {
      throw HttpResponseError.callbackReadOnly(slug);
    }

    const callback: Callback = {
      slug: currentCallback.slug,
      ...this.toEditableFields(data),
      annotations: [...currentCallback.annotations],
    };
    this.assertTemplatesAreValid(callback);

    await this.store.saveCallback(callback);
    await this.store.deploy();
    return callback;
  }

  async deleteCallback(slug: string): Promise<void> {
    const deleted = await this.store.deleteCallback(slug);
    if (!deleted) {
      const callback = await this.store.getCallback(slug);
      if (callback?.annotations.includes("READ_ONLY")) {
        throw HttpResponseError.callbackReadOnly(slug);
      }
      throw HttpResponseError.callbackNotFound(slug);
    }

    await this.store.deploy();
  }

  async listPending(): Promise<PendingCallbacksDto> {
    const pending = await this.store.listPendingCallbacks();
    if (pending === null) {
      return { isSupported: false, pending: [] };
    }

    return {
      isSupported: true,
      pending: [...pending].sort((a, b) => a.dueAt - b.dueAt),
    };
  }

  async fire(
    slug: string,
    payload: unknown,
    delay?: number,
  ): Promise<PendingCallbackDto> {
    return this.store.fireCallback(slug, payload, delay);
  }

  async firePending(id: string): Promise<void> {
    await this.store.firePendingCallback(id);
  }

  async cancelPending(id: string): Promise<void> {
    await this.store.cancelPendingCallback(id);
  }

  async clearPending(): Promise<void> {
    await this.store.clearPendingCallbacks();
  }

  private toEditableFields(
    data: PatchCallbackInput,
  ): Omit<Callback, "slug" | "annotations"> {
    return {
      name: data.name || undefined,
      method: data.method,
      host: data.host,
      path: data.path,
      url: data.url,
      delay: data.delay,
      headers: { ...data.headers },
      body: data.body || undefined,
    };
  }

  private assertTemplatesAreValid(callback: Callback): void {
    this.assertBodyTemplateIsValid(callback.body);
    this.assertFieldTemplateIsValid("path", callback.path);
    this.assertFieldTemplateIsValid("url", callback.url);
    for (const [key, value] of Object.entries(callback.headers)) {
      this.assertFieldTemplateIsValid(`header "${key}"`, value);
    }
  }

  private assertBodyTemplateIsValid(body?: string): void {
    if (!body) {
      return;
    }

    const parseResult = $template.applyTo(State.of(body));
    if (parseResult.error) {
      const { line, column } = this.indexToLineAndColumn(
        body,
        parseResult.state.index,
      );
      throw HttpResponseError.templateParseError({
        message: `Error at line ${line}, column ${column}: ${parseResult.error}`,
        line,
        column,
      });
    }
  }

  private assertFieldTemplateIsValid(field: string, template?: string): void {
    if (!template) {
      return;
    }

    const parseResult = $template.applyTo(State.of(template));
    if (parseResult.error) {
      throw HttpResponseError.badRequest(
        `Invalid template in ${field}: ${parseResult.error}`,
      );
    }
  }

  private indexToLineAndColumn(
    code: string,
    index: number,
  ): { line: number; column: number } {
    let line = 1;
    let column = 1;
    for (let i = 0; i < index && i < code.length; i++) {
      if (code[i] === "\n") {
        line += 1;
        column = 1;
      } else {
        column += 1;
      }
    }

    return { line, column };
  }
}

export const callbackService = new CallbackService(getStore());
