import {Provider} from "../utils/decorators/provider";
import {LaabrPlugin} from "./laabr";
import {IPlugin} from "../utils/plugin";

@Provider()
export class PluginProvider {
    constructor(
        private readonly laabr: LaabrPlugin,
    ) { }

    readonly plugins: IPlugin[] = [this.laabr];
}
