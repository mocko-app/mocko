import { createSubject, MockoInstance } from '../../harness';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('flags', () => {
  let subject: MockoInstance;

  beforeAll(async () => {
    subject = await createSubject();
    await subject.createMock(`
      mock "PUT /flag" {
        body = "{{setFlag 'test_flag' request.body.value}}"
      }
      mock "GET /flag" {
        body = "value: {{getFlag 'test_flag'}}"
      }
      mock "GET /flag-json" {
        body = "value: {{json (getFlag 'test_flag')}}"
      }
      mock "GET /flag-eq-true" {
        body = "{{#eq (getFlag 'test_flag') true}}yes{{else}}no{{/eq}}"
      }
      mock "GET /flag/{flag}" {
        body = "{{getFlag request.params.flag}}"
      }
      mock "DELETE /flag" {
        body = "{{delFlag 'test_flag'}}"
      }
      mock "GET /has-flag" {
        body = "{{#hasFlag 'test_flag'}}yes{{else}}no{{/hasFlag}}"
      }
      mock "GET /has-flag-noelse" {
        body = "{{#hasFlag 'test_flag'}}yes{{/hasFlag}}"
      }
      mock "PUT /ttl-flag" {
        body = "{{setFlag 'ttl_flag' request.body.value 300}}"
      }
      mock "PUT /ttl-flag-long" {
        body = "{{setFlag 'ttl_flag' request.body.value 60000}}"
      }
      mock "PUT /ttl-flag-nottl" {
        body = "{{setFlag 'ttl_flag' request.body.value}}"
      }
      mock "GET /ttl-flag" {
        body = "value: {{getFlag 'ttl_flag'}}"
      }
      mock "GET /has-ttl-flag" {
        body = "{{#hasFlag 'ttl_flag'}}yes{{else}}no{{/hasFlag}}"
      }
    `);
  });

  afterAll(async () => {
    await subject.stop();
  });

  it('sets and gets string flags correctly', async () => {
    await subject.client.put('/flag', { value: 'str' });
    const res = await subject.client.get('/flag');
    expect(res.data).toBe('value: str');
    expect((await subject.client.get('/flag-json')).data).toBe('value: "str"');
    expect((await subject.client.get('/flag-eq-true')).data).toBe('no');
  });

  it('sets and gets number flags correctly', async () => {
    await subject.client.put('/flag', { value: 42 });
    const res = await subject.client.get('/flag');
    expect(res.data).toBe('value: 42');
    expect((await subject.client.get('/flag-json')).data).toBe('value: 42');
    expect((await subject.client.get('/flag-eq-true')).data).toBe('no');
  });

  it('sets and gets boolean flags correctly', async () => {
    await subject.client.put('/flag', { value: true });
    const res = await subject.client.get('/flag');
    expect(res.data).toBe('value: true');
    expect((await subject.client.get('/flag-json')).data).toBe('value: true');
    expect((await subject.client.get('/flag-eq-true')).data).toBe('yes');
  });

  it('does not accept flags with empty sections in the middle', async () => {
    const res = await subject.client.get('/flag/foo::bar');
    expect(res.status).toBe(500);
  });

  it('does not accept flags with empty sections in the end', async () => {
    const res = await subject.client.get('/flag/foo:');
    expect(res.status).toBe(500);
  });

  it('sets, deletes and checks flags correctly', async () => {
    await subject.client.put('/flag', { value: 'foo' });
    expect((await subject.client.get('/has-flag')).data).toContain('yes');

    await subject.client.delete('/flag');
    expect((await subject.client.get('/has-flag')).data).toContain('no');
  });

  it('expires flags after their ttl', async () => {
    await subject.client.put('/ttl-flag', { value: 'short-lived' });
    expect((await subject.client.get('/ttl-flag')).data).toBe(
      'value: short-lived',
    );
    expect((await subject.client.get('/has-ttl-flag')).data).toContain('yes');

    await sleep(800);
    expect((await subject.client.get('/ttl-flag')).data).toBe('value: ');
    expect((await subject.client.get('/has-ttl-flag')).data).toContain('no');
  });

  it('keeps a running ttl when the flag is set again without one', async () => {
    await subject.client.put('/ttl-flag', { value: 'first' });
    await subject.client.put('/ttl-flag-nottl', { value: 'second' });
    expect((await subject.client.get('/ttl-flag')).data).toBe('value: second');

    await sleep(800);
    expect((await subject.client.get('/has-ttl-flag')).data).toContain('no');
  });

  it('replaces a running ttl when the flag is set again with a new one', async () => {
    await subject.client.put('/ttl-flag', { value: 'first' });
    await subject.client.put('/ttl-flag-long', { value: 'second' });

    await sleep(800);
    expect((await subject.client.get('/ttl-flag')).data).toBe('value: second');
    expect((await subject.client.get('/has-ttl-flag')).data).toContain('yes');
  });

  it('hasFlag works without an else block', async () => {
    await subject.client.put('/flag', { value: 'foo' });
    expect((await subject.client.get('/has-flag-noelse')).data).toContain(
      'yes',
    );

    await subject.client.delete('/flag');
    expect((await subject.client.get('/has-flag-noelse')).data).not.toContain(
      'yes',
    );
  });
});
