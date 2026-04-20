import { createSubject, MockoInstance, randomPath } from '../../harness';

const formats = [
  ['json', 'application/json'],
  ['html', 'text/html'],
  ['text', 'text/plain'],
  ['xml', 'application/xml'],
  ['javascript', 'text/javascript'],
  ['css', 'text/css'],
] as const;

describe('definition format field', () => {
  let subject: MockoInstance;

  beforeAll(async () => {
    subject = await createSubject();
  });

  afterAll(async () => {
    await subject.stop();
  });

  it.each(formats)(
    'sets Content-Type for format = "%s"',
    async (format, contentType) => {
      const route = randomPath();
      await subject.createMock(`
        mock "GET ${route}" {
          format = "${format}"
          body = "ok"
        }
      `);

      const res = await subject.client.get(route);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain(contentType);
    },
  );

  it('does not serve a mock that uses both format and an explicit Content-Type header', async () => {
    const route = randomPath();
    await subject.createMock(`
      mock "GET ${route}" {
        format = "json"
        headers {
          Content-Type = "application/json"
        }
        body = "{}"
      }
    `);

    const res = await subject.client.get(route);
    expect(res.status).toBe(404);
  });

  it('loads a mock with format and non-Content-Type headers', async () => {
    const route = randomPath();
    await subject.createMock(`
      mock "GET ${route}" {
        format = "json"
        headers {
          X-Test = "1"
        }
        body = "{}"
      }
    `);

    const res = await subject.client.get(route);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.headers['x-test']).toBe('1');
  });

  it('keeps explicit Content-Type behavior without format', async () => {
    const route = randomPath();
    await subject.createMock(`
      mock "GET ${route}" {
        headers {
          Content-Type = "application/json"
        }
        body = "{}"
      }
    `);

    const res = await subject.client.get(route);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
  });
});
