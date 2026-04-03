import { createSubject, MockoInstance, randomPath } from '../../harness';

// TODO cors is not being handled properly
describe.skip('cors', () => {
  let subject: MockoInstance;

  beforeAll(async () => {
    subject = await createSubject();
    await subject.createMock(`
      mock "GET /cors-resource" {
        body = "hello"
      }
    `);
  });

  afterAll(async () => {
    await subject.stop();
  });

  it('responds to OPTIONS preflight on a defined route', async () => {
    const res = await subject.client.options('/cors-resource');
    expect(res.status).toBe(200);
  });

  it('responds to OPTIONS on a GET-only mock route', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        body = "get only"
      }
    `);
    const res = await subject.client.options(path);
    expect(res.status).toBe(200);
  });

  it('responds to OPTIONS on a POST-only mock route', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "POST ${path}" {
        body = "post only"
      }
    `);
    const res = await subject.client.options(path);
    expect(res.status).toBe(200);
  });
});
