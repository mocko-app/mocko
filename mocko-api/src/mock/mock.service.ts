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
        const mocks = await this.repository.listMocks();
        const enabledMocks = mocks.filter(m => m.isEnabled);
        const disabledMocks = mocks.filter(m => !m.isEnabled);

        return [...enabledMocks, ...disabledMocks];
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
        const oldMock = await this.repository.findById(id);

        if(!oldMock) {
            throw new NotFoundException(`Mock '${id}' not found`);
        }

        mock.isEnabled = oldMock.isEnabled;

        await this.repository.save(mock);
        await this.repository.deleteFailure(id);
        await this.deploy();
        return mock;
    }

    async deleteOne(id: string): Promise<void> {
        await this.repository.deleteMock(id);
        await this.deploy();
    }

    async setEnabled(id: string, isEnabled: boolean): Promise<void> {
        const mock = await this.repository.findById(id);
        if(!mock) {
            throw new NotFoundException(`Mock '${id}' not found`);
        }

        mock.isEnabled = isEnabled;

        await this.repository.save(mock);
        await this.deploy();
    }

    private async deploy() {
        const mocks = await this.listAll();
        const enabledMocks = mocks.filter(m => m.isEnabled);
        const options = new MockOptions(enabledMocks);

        await this.repository.setOptions(options);
        await this.redisProvider.publish(DEPLOY_CHANNEL);
    }
}
