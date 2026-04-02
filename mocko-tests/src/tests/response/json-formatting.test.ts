import { createSubject, MockoInstance, randomPath } from '../../harness';

const raw = { transformResponse: [(v: string) => v] };

describe('json normalization', () => {
  let subject: MockoInstance;

  beforeAll(async () => {
    subject = await createSubject();
  });

  afterAll(async () => {
    await subject.stop();
  });

  it('pretty prints valid json when content-type is missing', async () => {
    const path = randomPath();

    await subject.createMock(`
      mock "GET ${path}" {
        body = <<EOF
          {
            "foo":"bar",
            "nested": { "baz": 1 }
          }
        EOF
      }
    `);

    const { data, headers } = await subject.client.get(path, raw);
    expect(data).toBe(`{
  "foo": "bar",
  "nested": {
    "baz": 1
  }
}`);
    expect(headers['content-type']).toContain('application/json');
  });

  it('pretty prints valid json and preserves an existing json content-type', async () => {
    const path = randomPath();

    await subject.createMock(`
      mock "GET ${path}" {
        headers {
          Content-Type = "application/json+hal"
        }
        body = "{\\"foo\\":\\"bar\\"}"
      }
    `);

    const { data, headers } = await subject.client.get(path, raw);
    expect(data).toBe(`{
  "foo": "bar"
}`);
    expect(headers['content-type']).toContain('application/json+hal');
  });

  it('skips json formatting when the content-type is not json', async () => {
    const path = randomPath();

    await subject.createMock(`
      mock "GET ${path}" {
        headers {
          Content-Type = "text/plain"
        }
        body = "{\\"foo\\":\\"bar\\"}"
      }
    `);

    const { data, headers } = await subject.client.get(path, raw);
    expect(data).toBe('{"foo":"bar"}');
    expect(headers['content-type']).toContain('text/plain');
  });

  it('considers headers set during rendering before formatting json', async () => {
    const path = randomPath();

    await subject.createMock(`
      mock "GET ${path}" {
        body = <<EOF
          {{setHeader 'Content-Type' 'application/json+hal'}}
          {"foo":"bar"}
        EOF
      }
    `);

    const { data, headers } = await subject.client.get(path, raw);
    expect(data).toBe(`{
  "foo": "bar"
}`);
    expect(headers['content-type']).toContain('application/json+hal');
  });

  it('uses the last content-type header case-insensitively when deciding json formatting', async () => {
    const path = randomPath();

    await subject.createMock(`
      mock "GET ${path}" {
        headers {
          content-type = "application/json"
        }
        body = <<EOF
          {{setHeader 'Content-Type' 'text/plain'}}
          {"foo":"bar"}
        EOF
      }
    `);

    const { data, headers } = await subject.client.get(path, raw);
    expect(data.trim()).toBe('{"foo":"bar"}');
    expect(headers['content-type']).toContain('text/plain');
  });

  it('returns raw text and sets text/plain when invalid json has no content-type', async () => {
    const path = randomPath();

    await subject.createMock(`
      mock "GET ${path}" {
        body = "{not-json"
      }
    `);

    const { data, headers } = await subject.client.get(path, raw);
    expect(data).toBe('{not-json');
    expect(headers['content-type']).toContain('text/plain');
  });

  it('returns raw text and preserves a declared json content-type when json is invalid', async () => {
    const path = randomPath();

    await subject.createMock(`
      mock "GET ${path}" {
        headers {
          Content-Type = "application/json+hal"
        }
        body = "{not-json"
      }
    `);

    const { data, headers } = await subject.client.get(path, raw);
    expect(data).toBe('{not-json');
    expect(headers['content-type']).toContain('application/json+hal');
  });

  it('uses json-like headers set during rendering when invalid json is returned', async () => {
    const path = randomPath();

    await subject.createMock(`
      mock "GET ${path}" {
        body = <<EOF
          {{setHeader 'Content-Type' 'application/json+hal'}}
          {not-json
        EOF
      }
    `);

    const { data, headers } = await subject.client.get(path, raw);
    expect(data.trim()).toBe('{not-json');
    expect(headers['content-type']).toContain('application/json+hal');
  });

  it('returns an empty body without a content-type when the rendered body is empty', async () => {
    const path = randomPath();

    await subject.createMock(`
      mock "GET ${path}" {
        body = ""
      }
    `);

    const { data } = await subject.client.get(path, raw);
    expect(data).toBe('');
  });

  it('collapses whitespace-only bodies to empty without a content-type', async () => {
    const path = randomPath();

    await subject.createMock(`
      mock "GET ${path}" {
        body = <<EOF
          
        EOF
      }
    `);

    const { data } = await subject.client.get(path, raw);
    expect(data).toBe('');
  });
});
