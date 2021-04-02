import {Service} from "../../utils/decorators/service";
import {configProvider} from "../../config/config.service";
import { DefinitionProvider } from "../../definitions/definition.provider";
import { Host } from "../../definitions/data/host";

const BASE_URI = configProvider.get('PROXY_BASE-URI');

@Service()
export class ProxyService {
    private readonly PROXY_URL: string;

    constructor(
        private readonly definitionProvider: DefinitionProvider,
    ) {
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

    async getHosts(): Promise<Host[]> {
        const definitions = await this.definitionProvider.getDefinitions();
        return definitions.hosts;
    }

    private baseUriToH2o2Path(uri: string): string {
        let path = uri;
        if(path.endsWith('/')) {
            path = path.slice(0, -1);
        }

        return path + '{path}';
    }
}
