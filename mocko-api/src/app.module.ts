import {Module} from '@nestjs/common';
import {MockModule} from './mock/mock.module';

@Module({
    imports: [MockModule],
    controllers: [],
    providers: [],
})
export class AppModule { }
