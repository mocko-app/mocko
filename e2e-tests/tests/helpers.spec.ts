import { mockAndGet } from "../utils/mock";

describe('Mocko proxy helpers', () => {

    describe('setStatus', () => {
        it('must set the status correctly', async () => {
            expect.assertions(1);
            try {
                await mockAndGet('{{setStatus 422}}');
            } catch(error) {
                expect(error.response.status).toBe(422);
            }
        });

        it('must emit error on invalid status', async () => {
            expect.assertions(1);
            try {
                await mockAndGet('{{setStatus 99}}');
            } catch(error) {
                expect(error.response.status).toBe(500);
            }
        });
    });

    describe('setHeader', () => {
        it('must set the header correctly', async () => {
            const key = 'x-custom-header';
            const value = 'my-value';

            const { headers } = await mockAndGet(`{{setHeader '${key}' '${value}'}}`);
            expect(headers[key]).toBe(value);
        });

        it('must override mock headers', async () => {
            const key = 'x-custom-header';
            const value = 'my-value';

            const { headers } = await mockAndGet(`{{setHeader '${key}' '${value}'}}`, {
                [key]: 'wrong-value',
            });
            expect(headers[key]).toBe(value);
        });
    });

    // describe('proxy', () => {
    // });
});
