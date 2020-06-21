import {IPlugin} from "../utils/plugin";
import * as laabr from 'laabr';
import {ConfigProvider} from "../config/config.service";
import {Provider} from "../utils/decorators/provider";

@Provider()
export class LaabrPlugin implements IPlugin {
    constructor(
        private readonly config: ConfigProvider,
    ) { }

    readonly plugin = laabr;
    readonly options = {
        formats: {
            response: this.config.get('SERVER_LOG-FORMAT'),
            onPostStart: '\0',
            onPostStop: '\0',
        }
    };
}
