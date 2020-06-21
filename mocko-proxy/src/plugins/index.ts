import {Provider} from "../utils/decorators/provider";
import {LaabrPlugin} from "./laabr";
import {IPlugin} from "../utils/plugin";
import {H2o2Plugin} from "./h2o2";

@Provider()
export class PluginProvider {
    constructor(
        private readonly laabr: LaabrPlugin,
        private readonly h2o2: H2o2Plugin,
    ) { }

    readonly plugins: IPlugin[] = [this.laabr, this.h2o2];
}
