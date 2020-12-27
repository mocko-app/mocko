import {Service} from "../../utils/decorators/service";
import {configProvider} from "../../config/config.service";

const BASE_URI = configProvider.get('PROXY_BASE-URI');

@Service()
export class ProxyService {
    private readonly PROXY_URL: string;

    constructor() {
        let proxyUrl = BASE_URI;
        if(proxyUrl.endsWith('/')) {
            proxyUrl = proxyUrl.slice(0, -1);
        }

        this.PROXY_URL = proxyUrl + '{path}';
    }

    isProxyEnabled(): boolean {
        return Boolean(BASE_URI.trim());
    }

    getProxyUri(): string {
        return this.PROXY_URL;
    }
}
