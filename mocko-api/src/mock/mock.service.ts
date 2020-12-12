import {Injectable, NotFoundException} from '@nestjs/common';
import {Mock} from "./data/mock.entity";
import {CreateMockRequestDto} from "./data/create-mock-request.dto";
import {MockRepository} from "./mock.repository";
import {MockOptions} from "./data/mock-options.entity";
import {RedisProvider} from "../redis/redis.provider";
import {DEPLOY_CHANNEL} from "./mock.constants";

@Injectable()
export class MockService {
    constructor(
        private readonly repository: MockRepository,
        private readonly redisProvider: RedisProvider,
    ) { }

    async listAll(): Promise<Mock[]> {
        return this.repository.listMocks();
    }

    async findById(id: string): Promise<Mock> {
        const mock = await this.repository.findById(id);

        if(!mock) {
            throw new NotFoundException(`Mock '${id}' not found`);
        }

        return mock;
    }

    async create(request: CreateMockRequestDto): Promise<Mock> {
        const mock = Mock.ofDto(request);
        await this.repository.save(mock);
        await this.deploy();
        return mock;
    }

    async update(id: string, request: CreateMockRequestDto): Promise<Mock> {
        const mock = Mock.ofIdAndDto(id, request);
        const oldMock = this.repository.findById(id);

        if(!oldMock) {
            throw new NotFoundException(`Mock '${id}' not found`);
        }

        await this.repository.save(mock);
        await this.repository.deleteFailure(id);
        await this.deploy();
        return mock;
    }

    async deleteOne(id: string): Promise<void> {
        await this.repository.deleteMock(id);
        await this.deploy();
    }

    private async deploy() {
        const mocks = await this.listAll();
        const options = new MockOptions(mocks);

        await this.repository.setOptions(options);
        await this.redisProvider.publish(DEPLOY_CHANNEL);
    }
}
