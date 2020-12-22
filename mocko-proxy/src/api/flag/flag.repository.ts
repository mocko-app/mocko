import {Service} from "../../utils/decorators/service";

@Service()
export class FlagRepository {
    private readonly flags: Map<string, any> = new Map();

    set(key: string, value: any): void {
        this.flags.set(key, value);
    }

    get(key: string): any {
        return this.flags.get(key);
    }

    del(key: string): void {
        this.flags.delete(key);
    }

    has(key: string): boolean {
        return this.flags.has(key);
    }
}
