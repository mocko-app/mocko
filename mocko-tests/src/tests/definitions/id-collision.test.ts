import { createSubject, MockoInstance, randomPath } from '../../harness';
import { AxiosInstance } from 'axios';

describe('file mock id collision', () => {
  let subject: MockoInstance;
  let control: AxiosInstance;
  let route: string;

  beforeAll(async () => {
    subject = await createSubject({ '--ui': true });
    control = subject.ensureControl();

    route = randomPath();
    await subject.createMock(`
      mock "GET ${route}" {
        name = "First"
        body = "first"
      }
      mock "GET ${route}" {
        name = "Second"
        body = "second"
      }
    `);
  });

  afterAll(() => subject.stop());

  it('gives conflicting file mocks distinct ids and lists both', async () => {
    const listRes = await control.get('/api/mocks');
    expect(listRes.status).toBe(200);

    const conflicting = listRes.data.filter((m: any) => m.path === route);
    expect(conflicting).toHaveLength(2);

    const ids = conflicting.map((m: any) => m.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('resolves each conflicting mock to its own definition by id', async () => {
    const listRes = await control.get('/api/mocks');
    const conflicting = listRes.data.filter((m: any) => m.path === route);

    const byName = Object.fromEntries(
      conflicting.map((m: any) => [m.name, m.id]),
    );

    const first = await control.get(`/api/mocks/${byName['First']}`);
    expect(first.data.name).toBe('First');
    expect(first.data.response.body).toBe('first');

    const second = await control.get(`/api/mocks/${byName['Second']}`);
    expect(second.data.name).toBe('Second');
    expect(second.data.response.body).toBe('second');
  });
});
