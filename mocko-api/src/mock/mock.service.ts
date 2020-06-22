import {Injectable} from '@nestjs/common';
import {Mock} from "./data/mock.entity";
import {CreateMockRequestDto} from "./data/create-mock-request.dto";

@Injectable()
export class MockService {

    async listAll(): Promise<Mock[]> {
        return [];
    }

    async create(request: CreateMockRequestDto): Promise<void> {

    }

    async deleteOne(id: string): Promise<void> {

    }
}
