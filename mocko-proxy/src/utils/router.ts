import {ServerRoute} from "@hapi/hapi";

export interface IRouter {
    readonly routes: ServerRoute[];
}
