import { $template } from "bigodon/dist/parser";
import { State } from "pierrejs";
import { sortPendingCallbacks } from "@/lib/callback/pending-sort";
import { isFileDefinition } from "@/lib/conflict/conflicts";
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
import { isOverriddenByUi } from "@/lib/utils/slugs";

const CALLBACK_HOLD_CAPABILITY = "callback-hold";

export class CallbackService {
  constructor(private readonly store: Store) {}

  async listCallbacks(): Promise<Callback[]> {
    return this.store.listCallbacks();
  }

  async getCallback(id: string): Promise<Callback> {
    const callback = await this.store.getCallback(id);
    if (!callback) {
      throw HttpResponseError.callbackNotFound(id);
    }

    return callback;
  }

  async createCallback(data: CreateCallbackInput): Promise<Callback> {
    const callbacks = await this.store.listCallbacks();
    const slug = data.slug.toLowerCase();
    const taken = callbacks.some(
      (callback) =>
        !isFileDefinition(callback) && callback.slug.toLowerCase() === slug,
    );
    if (taken) {
      throw HttpResponseError.callbackSlugConflict(data.slug);
    }

    const callback: Callback = {
      id: crypto.randomUUID(),
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
    id: string,
    data: PatchCallbackInput,
  ): Promise<Callback> {
    const currentCallback = await this.store.getCallback(id);
    if (!currentCallback) {
      throw HttpResponseError.callbackNotFound(id);
    }
    if (currentCallback.annotations.includes("READ_ONLY")) {
      throw HttpResponseError.callbackReadOnly(id);
    }

    const callback: Callback = {
      id: currentCallback.id,
      slug: currentCallback.slug,
      ...this.toEditableFields(data),
      annotations: [...currentCallback.annotations],
    };
    this.assertTemplatesAreValid(callback);

    await this.store.saveCallback(callback);
    await this.store.deploy();
    return callback;
  }

  async deleteCallback(id: string): Promise<void> {
    const deleted = await this.store.deleteCallback(id);
    if (!deleted) {
      const callback = await this.store.getCallback(id);
      if (callback?.annotations.includes("READ_ONLY")) {
        throw HttpResponseError.callbackReadOnly(id);
      }
      throw HttpResponseError.callbackNotFound(id);
    }

    await this.store.deploy();
  }

  async listPending(): Promise<PendingCallbacksDto> {
    const [pending, capabilities] = await Promise.all([
      this.store.listPendingCallbacks(),
      this.store.getCoreCapabilities(),
    ]);
    if (pending === null) {
      return { isSupported: false, canHold: false, pending: [] };
    }

    return {
      isSupported: true,
      canHold: capabilities.includes(CALLBACK_HOLD_CAPABILITY),
      pending: sortPendingCallbacks(pending),
    };
  }

  async fire(
    id: string,
    payload: unknown,
    delay?: number,
  ): Promise<PendingCallbackDto> {
    const callbacks = await this.store.listCallbacks();
    const callback = callbacks.find((item) => item.id === id);
    if (!callback) {
      throw HttpResponseError.callbackNotFound(id);
    }
    if (isOverriddenByUi(callback, callbacks)) {
      throw HttpResponseError.callbackShadowed(id);
    }

    return this.store.fireCallback(callback.slug, payload, delay);
  }

  async firePending(id: string): Promise<void> {
    await this.store.firePendingCallback(id);
  }

  async holdPending(id: string): Promise<PendingCallbackDto> {
    const capabilities = await this.store.getCoreCapabilities();
    if (!capabilities.includes(CALLBACK_HOLD_CAPABILITY)) {
      throw HttpResponseError.unprocessableEntity(
        "Your Mocko core doesn't support holding callbacks. Upgrade it to use Hold.",
      );
    }

    return this.store.holdPendingCallback(id);
  }

  async cancelPending(id: string): Promise<void> {
    await this.store.cancelPendingCallback(id);
  }

  async clearPending(): Promise<void> {
    await this.store.clearPendingCallbacks();
  }

  private toEditableFields(
    data: PatchCallbackInput,
  ): Omit<Callback, "id" | "slug" | "filePath" | "annotations"> {
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
