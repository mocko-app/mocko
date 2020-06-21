import {IPlugin} from "../utils/plugin";
import * as H2o2 from '@hapi/h2o2';
import {Provider} from "../utils/decorators/provider";

@Provider()
export class H2o2Plugin implements IPlugin {
    readonly plugin = H2o2;
    readonly options = {};
}
