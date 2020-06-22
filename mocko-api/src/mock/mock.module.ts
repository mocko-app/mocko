import {Module} from '@nestjs/common';
import {MockService} from './mock.service';
import {MockController} from './mock.controller';
import {MockRepository} from "./mock.repository";

@Module({
  providers: [MockService, MockRepository],
  controllers: [MockController]
})
export class MockModule {}
