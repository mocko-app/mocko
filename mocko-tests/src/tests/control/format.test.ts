import { createSubject, MockoInstance, randomPath } from '../../harness';

describe('control format integration', () => {
  let subject: MockoInstance;

  afterEach(async () => {
    if (subject) {
      await subject.stop();
    }
  });

  it('returns file mock format in details', async () => {
    const route = randomPath();
    subject = await createSubject({ '--ui': true });
    await subject.createMock(`
      mock "GET ${route}" {
        format = "json"
        body = "{}"
      }
    `);

    const listRes = await subject.ensureControl().get('/api/mocks');
    expect(listRes.status).toBe(200);
    const listedMock = listRes.data.find((mock: any) => mock.path === route);
    expect(listedMock).toBeTruthy();

    const detailsRes = await subject
      .ensureControl()
      .get(`/api/mocks/${listedMock.id}`);
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.format).toBe('json');
  });

  it('serves UI mock format as Content-Type', async () => {
    const route = randomPath();
    subject = await createSubject({ '--ui': true });

    const createRes = await subject.ensureControl().post('/api/mocks', {
      name: 'formatted',
      method: 'GET',
      path: route,
      format: 'json',
      response: {
        code: 200,
        body: '{}',
        headers: {},
      },
    });
    expect(createRes.status).toBe(201);
    expect(createRes.data.format).toBe('json');

    const res = await subject.client.get(route);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
  });

  it('rejects UI mocks that combine format and Content-Type', async () => {
    const route = randomPath();
    subject = await createSubject({ '--ui': true });

    const res = await subject.ensureControl().post('/api/mocks', {
      name: 'invalid format',
      method: 'GET',
      path: route,
      format: 'json',
      response: {
        code: 200,
        body: '{}',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    });

    expect(res.status).toBe(400);
  });
});
