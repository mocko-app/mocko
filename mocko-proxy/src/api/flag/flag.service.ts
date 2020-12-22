import {Service} from "../../utils/decorators/service";
import { FlagRepository } from "./flag.repository";

@Service()
export class FlagService {
    constructor(
        private readonly repository: FlagRepository,
    ) { }

    setFlag(key: string, value: any): void {
        this.repository.set(key, value);
    }

    getFlag(key: string): any {
        return this.repository.get(key);
    }

    delFlag(key: string): void {
        this.repository.del(key);
    }

    hasFlag(key: string): boolean {
        return this.repository.has(key);
    }
}
