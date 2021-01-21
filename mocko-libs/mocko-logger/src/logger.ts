import * as Hoek from '@hapi/hoek';
import * as colors from 'colors/safe';
import { IColumn } from "./columns/column";
import { FixedTextColumn } from './columns/fixed-text';
import { TextColumn } from './columns/text';
import { TimestampColumn } from './columns/timestamp';

const debug = require('debug')('mocko:logger');

const SILENT = process.env.SILENT === "true";

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

    public build(...params: any[]): string {
        Hoek.assert(params.length === this.paramCount, `this logger expected ${this.paramCount} params but got ${params.length}`);
        const iterator = params[Symbol.iterator]();
        const values = this.columns.map(c => c.accept(iterator));

        return values.join(' ');
    }

    public log = (...params: any[]) => {
        const message = this.build(...params);

        if(SILENT) {
            debug(message);
            return;
        }

        process.stdout.write(message + '\n');
    }
}

const msgLog = (levelColumn: IColumn) => new Logger()
    .column(LogColumn.timestamp().color(colors.dim))
    .column(levelColumn)
    .column(LogColumn.text())
    .log;

export type ILogger = Record<'info' | 'warn' | 'error', (message: string) => void>;
export const simpleLogger = {
    info:  msgLog(LogColumn.fixed(' info').color(colors.dim)),
    warn:  msgLog(LogColumn.fixed(' warn').color(colors.yellow)),
    error: msgLog(LogColumn.fixed('error').color(colors.bgRed)),
};
