import {Service} from "../../utils/decorators/service";
import {MockResponse} from "./data/mock-options";
import {Lifecycle, Request, ResponseObject, ResponseToolkit, ServerRoute} from "@hapi/hapi";
import {MockRepository} from "./mock.repository";

@Service()
export class MockService {
    constructor(
        private readonly repository: MockRepository,
    ) { }

    async getRoutes(): Promise<ServerRoute[]> {
        const options = await this.repository.getMockOptions();

        return options.mocks.map(({ method, path, response }) => ({
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
