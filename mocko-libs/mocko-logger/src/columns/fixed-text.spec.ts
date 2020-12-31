import { FixedTextColumn } from "./fixed-text";

describe('fixed text column', () => {
    it('should return correct text', () => {
        const column = new FixedTextColumn('foo');
        const text = column['_build']();

        expect(text).toBe('foo');
    });
});
