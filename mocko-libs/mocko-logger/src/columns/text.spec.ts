import { TextColumn } from "./text";

describe('text column', () => {
    const text = "   Lorem ipsum ";

    it('should return correct unpadded text', () => {
        const column = new TextColumn();
        const actual = column['_build'](text);

        expect(actual).toBe('Lorem ipsum');
    });

    it('should return correct left-aligned text', () => {
        const column = new TextColumn().size(16);
        const actual = column['_build'](text);

        expect(actual).toBe('Lorem ipsum     ');
    });

    it('should return correct right-aligned text', () => {
        const column = new TextColumn().size(16).right();
        const actual = column['_build'](text);

        expect(actual).toBe('     Lorem ipsum');
    });
});
