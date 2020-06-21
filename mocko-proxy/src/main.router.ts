import {IRouter} from "./utils/router";
import {CatRouter} from "./api/cat/cat.router";
import {Provider} from "./utils/decorators/provider";

@Provider()
export class MainRouter implements IRouter {
    constructor(
        private readonly catRouter: CatRouter,
    ) { }

    readonly routes = [...this.catRouter.routes];
}
