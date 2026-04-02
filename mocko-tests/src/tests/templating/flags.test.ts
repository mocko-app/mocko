import { createSubject, MockoInstance } from '../../harness';

describe('flags', () => {
  let subject: MockoInstance;

  beforeAll(async () => {
    subject = await createSubject();
    await subject.createMock(`
      mock "PUT /flag/{value}" {
        body = "{{setFlag 'test_flag' request.params.value}}"
      }
      mock "GET /flag" {
        body = "{{getFlag 'test_flag'}}"
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
    `);
  });

  afterAll(async () => {
    await subject.stop();
  });

  it('sets and gets flags correctly', async () => {
    await subject.client.put('/flag/ablueblue');
    const res = await subject.client.get('/flag');
    expect(res.data).toBe('ablueblue');
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
    await subject.client.put('/flag/foo');
    expect((await subject.client.get('/has-flag')).data).toContain('yes');

    await subject.client.delete('/flag');
    expect((await subject.client.get('/has-flag')).data).toContain('no');
  });

  it('hasFlag works without an else block', async () => {
    await subject.client.put('/flag/foo');
    expect((await subject.client.get('/has-flag-noelse')).data).toContain(
      'yes',
    );

    await subject.client.delete('/flag');
    expect((await subject.client.get('/has-flag-noelse')).data).not.toContain(
      'yes',
    );
  });
});
