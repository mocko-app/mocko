import * as Hoek from '@hapi/hoek';
import { IColumn } from "./columns/column";
import { FixedTextColumn } from './columns/fixed-text';
import { TextColumn } from './columns/text';
import { TimestampColumn } from './columns/timestamp';

export const LogColumn = {
    timestamp: () => new TimestampColumn,
    text: () => new TextColumn,
    fixed: (text: string) => new FixedTextColumn(text),
};

export class Logger {
    private readonly columns: IColumn[] = [];
    private paramCount = 0;

    public column(column: IColumn): Logger {
        this.columns.push(column);

        if(column.hasText) {
            this.paramCount++;
        }

        return this;
    }

    public log = (...params: any[]) => {
        Hoek.assert(params.length === this.paramCount, `this logger expected ${this.paramCount} params but got ${params.length}`);
        const iterator = params[Symbol.iterator]();
        const values = this.columns.map(c => c.accept(iterator));

        process.stdout.write(values.join(' ') + '\n');
    }
}
