import {Service} from "../../utils/decorators/service";
import {MockOptions, MockResponse} from "./data/mock-options";
import * as fs from 'fs';
import {Lifecycle, Request, ResponseObject, ResponseToolkit, ServerRoute} from "@hapi/hapi";

@Service()
export class MockService {
    private readonly mockOptions: MockOptions;

    constructor() {
        const mockOptions = fs.readFileSync('./mocks.json').toString();
        this.mockOptions = JSON.parse(mockOptions) as MockOptions;
    }

    get routes(): ServerRoute[] {
        return this.mockOptions.mocks.map(({ method, path, response }) => ({
            method, path, handler: this.buildHandler(response)
        }));
    }

    private buildHandler(response: MockResponse): Lifecycle.Method {
        return (request: Request, h: ResponseToolkit): ResponseObject => {
            const res = h
                .response(response.body)
                .code(response.code);

            Object.entries(response.headers).forEach(([key, value]) =>
                res.header(key, value));

            return res;
        };
    }
}
