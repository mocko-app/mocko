import {IListener} from "../utils/listener";
import {Provider} from "../utils/decorators/provider";
import {RemapEventBus} from "../utils/remap-event-bus";

@Provider()
export class DeployListener implements IListener {
    readonly channel = 'deploy';

    constructor(
        private readonly remapEventBus: RemapEventBus,
    ) { }

    async onMessage(_message: string) {
        await this.remapEventBus.emit();
    }
}
