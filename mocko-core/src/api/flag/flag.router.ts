import { ServerRoute } from "@hapi/hapi";
import { Provider } from "../../utils/decorators/provider";
import { IRouter } from "../../utils/router";
import { FlagController } from "./flag.controller";

@Provider()
export class FlagRouter implements IRouter {
    constructor(
        private readonly controller: FlagController,
    ) { }

    async getRoutes(): Promise<ServerRoute[]> {
        return [
            {
                method: 'GET',
                path: '/__mocko__/flags',
                handler: this.controller.listFlags.bind(this.controller),
                rules: {
                    mapSilently: true,
                },
            },
            {
                method: 'GET',
                path: '/__mocko__/flags/{key}',
                handler: this.controller.getFlag.bind(this.controller),
                rules: {
                    mapSilently: true,
                },
            },
            {
                method: 'PUT',
                path: '/__mocko__/flags/{key}',
                handler: this.controller.putFlag.bind(this.controller),
                rules: {
                    mapSilently: true,
                },
            },
            {
                method: 'DELETE',
                path: '/__mocko__/flags/{key}',
                handler: this.controller.deleteFlag.bind(this.controller),
                rules: {
                    mapSilently: true,
                },
            },
        ];
    }
}
