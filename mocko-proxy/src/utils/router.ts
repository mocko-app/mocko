import {ServerRoute} from "@hapi/hapi";

export interface IRouter {
    getRoutes(): Promise<ServerRoute[]>;
}
