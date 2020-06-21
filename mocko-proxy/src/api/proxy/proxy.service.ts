import {Service} from "../../utils/decorators/service";
import {ConfigProvider} from "../../config/config.service";

@Service()
export class ProxyService {
    constructor(
        private readonly config: ConfigProvider,
    ) { }

    getProxyUri(): string {
        return this.config.get('PROXY_BASE-URI') + '{path}';
    }
}
