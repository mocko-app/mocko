import {Plugin} from '@hapi/hapi';

export interface IPlugin {
    readonly plugin: Plugin<any>;
    readonly options: any;
}
