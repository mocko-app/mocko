import { TimestampColumn, TimestampFormat } from "./timestamp";

describe('timestamp column', () => {
    const date = new Date('2000-01-02T03:04:05.006Z');

    it('should return correct ISO format', () => {
        const column = new TimestampColumn().iso();
        const text = column['_build'](date);

        expect(text).toBe('2000-01-02T03:04:05.006Z');
    });

    it('should return correct UTC format', () => {
        const column = new TimestampColumn().utc();
        const text = column['_build'](date);

        expect(text).toBe('Sun, 02 Jan 2000 03:04:05 GMT');
    });

    it('should return correct MILLIS format', () => {
        const column = new TimestampColumn().millis();
        const text = column['_build'](date);

        expect(text).toBe('946782245006');
    });

    it('should return correct CLF format', () => {
        const column = new TimestampColumn();
        const text = column['_build'](date);

        expect(text).toBe('02/Jan/2000 03:04:05.006');
    });
});
