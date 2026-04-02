import { createSubject, MockoInstance, randomPath } from '../harness';

describe('smoke', () => {
  let subject: MockoInstance;

  beforeAll(async () => {
    subject = await createSubject();
  });

  afterAll(async () => {
    await subject.stop();
  });

  it('serves a mock after createMock', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        body = "hello from mocko"
      }
    `);
    const res = await subject.client.get(path);
    expect(res.status).toBe(200);
    expect(res.data).toBe('hello from mocko');
  });
});
