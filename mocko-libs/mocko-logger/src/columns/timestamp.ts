import { ISimpleColumn } from "./column";

export enum TimestampFormat {
    ISO,
    UTC,
    MILLIS,
    CLF,
}

export class TimestampColumn extends ISimpleColumn {
    private readonly MONTHS = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    private format = TimestampFormat.CLF;

    public    iso(): TimestampColumn { this.format = TimestampFormat.ISO;    return this; }
    public    utc(): TimestampColumn { this.format = TimestampFormat.UTC;    return this; }
    public millis(): TimestampColumn { this.format = TimestampFormat.MILLIS; return this; }
    public    clf(): TimestampColumn { this.format = TimestampFormat.CLF;    return this; }

    protected _build(date = new Date()): string {
        switch(this.format) {
            case TimestampFormat.ISO:
                return date.toISOString();

            case TimestampFormat.UTC:
                return date.toUTCString();

            case TimestampFormat.MILLIS:
                return date.getTime().toString();

            default:
                return this.buildClf(date);
        }
    }

    private buildClf(date: Date): string {
        const  year = date.getUTCFullYear();
        const month = this.MONTHS[date.getUTCMonth()];
        const   day = date.getUTCDate();

        const  hour = date.getUTCHours();
        const  mins = date.getUTCMinutes();
        const  secs = date.getUTCSeconds();
        const milli = date.getUTCMilliseconds();
      
        return `${this.pad(day)}/${month}/${year} ${this.pad(hour)}:${this.pad(mins)}:${this.pad(secs)}.${this.pad(milli, 3)}`;
    }

    private pad(str: number, len = 2): string {
        return str.toString().padStart(len, '0');
    }
}
