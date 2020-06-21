import {Service} from "../../utils/decorators/service";

@Service()
export class CatService {

    async listAll(): Promise<unknown[]> {
        return [];
    }
}
