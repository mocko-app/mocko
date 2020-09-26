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

    // TODO add these tests
    // describe('setHeader', () => {
    //     it('must set the header correctly', async () => {

    //     });
    // });

    // describe('proxy', () => {
    // });
});
