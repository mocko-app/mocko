import { Service } from "../../utils/decorators/service";
import { DefinitionProvider } from "../../definitions/definition.provider";
import { CoreCallbackDto } from "./data/core-callback.dto";

@Service()
export class CallbackService {
    constructor(
        private readonly definitionProvider: DefinitionProvider,
    ) { }

    async listCallbacks(): Promise<CoreCallbackDto[]> {
        const callbacks = await this.definitionProvider.getFileCallbacks();
        return callbacks.map((callback) => CoreCallbackDto.ofCallback(callback));
    }
}
