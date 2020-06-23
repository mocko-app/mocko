import {IListener} from "../utils/listener";
import {Provider} from "../utils/decorators/provider";
import {Server} from "../server";

@Provider()
export class DeployListener implements IListener {
    readonly channel = 'deploy';

    async onMessage(message: string, server: Server) {
        await server.restart();
    }
}
