import {IPlugin} from "../utils/plugin";
import {Provider} from "../utils/decorators/provider";
import { hapiRequestLogger } from "@mocko/logger";

@Provider()
export class LoggerPlugin implements IPlugin {
    readonly plugin = hapiRequestLogger;
    readonly options = {
        ignoredRoutes: [
            '/health',
            '/__mocko__',
            '/__mocko__/deploy',
            '/__mocko__/mocks',
            '/__mocko__/mocks/{id}',
        ]
    };
}
