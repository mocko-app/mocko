import {Provider} from "../../utils/decorators/provider";
import * as Hapi from '@hapi/hapi';
import {CatService} from "./cat.service";

@Provider()
export class CatController {
    constructor(
        private readonly service: CatService,
    ) { }

    async listAll(request: Hapi.Request, toolkit: Hapi.ResponseToolkit) {
        return await this.service.listAll();
    }
}
