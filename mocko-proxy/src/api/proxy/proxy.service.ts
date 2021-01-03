import {Service} from "../../utils/decorators/service";
import {configProvider} from "../../config/config.service";

const BASE_URI = configProvider.get('PROXY_BASE-URI');

@Service()
export class ProxyService {
    private readonly PROXY_URL: string;

    constructor() {
        this.PROXY_URL = this.baseUriToH2o2Path(BASE_URI);
    }

    isProxyEnabled(): boolean {
        return Boolean(BASE_URI.trim());
    }

    getProxyUri(overrideUri?: string): string {
        if(overrideUri) {
            return this.baseUriToH2o2Path(overrideUri);
        }

        return this.PROXY_URL;
    }

    private baseUriToH2o2Path(uri: string): string {
        let path = uri;
        if(path.endsWith('/')) {
            path = path.slice(0, -1);
        }

        return path + '{path}';
    }
}
