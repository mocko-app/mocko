import {Provider} from "../utils/decorators/provider";
import {LoggerPlugin} from "./logger";
import {IPlugin} from "../utils/plugin";
import {H2o2Plugin} from "./h2o2";

@Provider()
export class PluginProvider {
    constructor(
        private readonly logger: LoggerPlugin,
        private readonly h2o2: H2o2Plugin,
    ) { }

    readonly plugins: IPlugin[] = [this.logger, this.h2o2];
}
