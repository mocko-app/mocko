import {Module} from '@nestjs/common';
import {MockService} from './mock.service';
import {MockController} from './mock.controller';

@Module({
  providers: [MockService],
  controllers: [MockController]
})
export class MockModule {}
