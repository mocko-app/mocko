import { createSubject, MockoInstance, randomPath } from '../../harness';
import { AxiosInstance } from 'axios';

describe('labels', () => {
  let subject: MockoInstance;
  let control: AxiosInstance;

  let deployedMockId: string;
  let deployedMockWithDetailId: string;
  let fileMockRoute: string;
  let fileMockWithDetailRoute: string;

  beforeAll(async () => {
    subject = await createSubject({ '--ui': true });
    control = subject.ensureControl();

    const res1 = await control.post('/api/mocks', {
      name: 'labeled deployed mock',
      method: 'GET',
      path: randomPath(),
      labels: ['Payment', 'Auth'],
      response: { code: 200 },
    });
    deployedMockId = res1.data.id;

    const res2 = await control.post('/api/mocks', {
      name: 'labeled deployed mock for details',
      method: 'GET',
      path: randomPath(),
      labels: ['Checkout'],
      response: { code: 200 },
    });
    deployedMockWithDetailId = res2.data.id;

    fileMockRoute = randomPath();
    await subject.createMock(`
      mock "GET ${fileMockRoute}" {
        labels = ["Payment", "Auth"]
        body   = "ok"
      }
    `);

    fileMockWithDetailRoute = randomPath();
    await subject.createMock(`
      mock "GET ${fileMockWithDetailRoute}" {
        labels = ["Payment", "Auth"]
        body   = "ok"
      }
    `);
  });

  afterAll(() => subject.stop());

  it('persists labels when creating a mock and returns them when listing', async () => {
    const listRes = await control.get('/api/mocks');
    expect(listRes.status).toBe(200);
    const mock = listRes.data.find((m: any) => m.id === deployedMockId);
    expect(mock).toBeTruthy();
    expect(mock.labels).toEqual(['Payment', 'Auth']);
  });

  it('persists labels when creating a mock and returns them when getting details', async () => {
    const detailsRes = await control.get(
      `/api/mocks/${deployedMockWithDetailId}`,
    );
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.labels).toEqual(['Checkout']);
  });

  it('returns labels from file mocks when listing', async () => {
    const listRes = await control.get('/api/mocks');
    expect(listRes.status).toBe(200);
    const mock = listRes.data.find((m: any) => m.path === fileMockRoute);
    expect(mock).toBeTruthy();
    expect(mock.labels).toEqual(['Payment', 'Auth']);
  });

  it('returns labels from file mocks when getting details', async () => {
    const listRes = await control.get('/api/mocks');
    const mock = listRes.data.find(
      (m: any) => m.path === fileMockWithDetailRoute,
    );
    const detailsRes = await control.get(`/api/mocks/${mock.id}`);
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.labels).toEqual(['Payment', 'Auth']);
  });
});
