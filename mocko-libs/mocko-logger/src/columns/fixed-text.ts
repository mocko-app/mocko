import { ISimpleColumn } from "./column";

export class FixedTextColumn extends ISimpleColumn {
    constructor(
        private readonly text: string,
    ) { super(); }

    protected _build(): string {
        return this.text;
    }
}
