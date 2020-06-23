import {Server} from "../server";

export interface IListener {
    readonly channel: string;
    onMessage(message: string, server: Server): any;
}
