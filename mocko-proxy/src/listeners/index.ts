import {Provider} from "../utils/decorators/provider";
import {DeployListener} from "./deploy-listener";
import {IListener} from "../utils/listener";

@Provider()
export class ListenerProvider {
    constructor(
        private readonly deploy: DeployListener,
    ) { }

    readonly listeners: IListener[] = [this.deploy];
}
