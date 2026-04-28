import { createSubject, MockoInstance, randomPath } from '../../harness';

describe('response status', () => {
  let subject: MockoInstance;

  beforeAll(async () => {
    subject = await createSubject();
  });

  afterAll(async () => {
    await subject.stop();
  });

  it('returns 200 on healthcheck with revision', async () => {
    const res = await subject.client.get('/__mocko__/health');
    expect(res.status).toBe(200);
    expect(typeof res.data.revision).toBe('number');
  });

  it('defaults the status to 200 for GET, PUT and DELETE mocks', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" { }
      mock "PUT ${path}" { }
      mock "DELETE ${path}" { }
    `);

    expect((await subject.client.get(path)).status).toBe(200);
    expect((await subject.client.put(path)).status).toBe(200);
    expect((await subject.client.delete(path)).status).toBe(200);
  });

  it('defaults the status to 201 for POST mocks', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "POST ${path}" { }
    `);

    expect((await subject.client.post(path)).status).toBe(201);
  });

  it('defaults the status to 200 for wildcard mocks', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "* ${path}" { }
    `);

    expect((await subject.client.post(path)).status).toBe(200);
    expect((await subject.client.get(path)).status).toBe(200);
  });

  it('sets the status with the status parameter', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        status = 204
      }
    `);

    expect((await subject.client.get(path)).status).toBe(204);
  });

  it('returns 404 on undefined routes', async () => {
    expect((await subject.client.get('/undefined-route')).status).toBe(404);
  });
});
