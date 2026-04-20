import { Provider } from "./decorators/provider";

@Provider()
export class RemapEventBus {
    private readonly handlers: Array<() => Promise<void>> = [];

    subscribe(handler: () => Promise<void>): void {
        this.handlers.push(handler);
    }

    async emit(): Promise<void> {
        await Promise.all(this.handlers.map(h => h()));
    }
}
