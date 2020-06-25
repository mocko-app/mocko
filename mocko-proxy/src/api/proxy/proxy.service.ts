import {Service} from "../../utils/decorators/service";
import {configProvider} from "../../config/config.service";

const BASE_URI = configProvider.get('PROXY_BASE-URI');

@Service()
export class ProxyService {

    isProxyEnabled(): boolean {
        return Boolean(BASE_URI.trim());
    }

    getProxyUri(): string {
        return BASE_URI + '{path}';
    }
}
