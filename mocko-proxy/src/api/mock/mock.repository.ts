import {Provider} from "../../utils/decorators/provider";
import * as fs from "fs";
import {MockOptions} from "./data/mock-options";
import {promisify} from "util";

const readFile = promisify(fs.readFile);

@Provider()
export class MockRepository {

    async getMockOptions() {
        const buffer = await readFile('./mocks.json');
        return JSON.parse(buffer.toString()) as MockOptions;
    }
}
