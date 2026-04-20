export interface IListener {
    readonly channel: string;
    onMessage(message: string): any;
}
