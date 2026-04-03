import { createSubject, MockoInstance } from '../../harness';

describe('data stanza', () => {
  let subject: MockoInstance;

  beforeAll(async () => {
    subject = await createSubject();
  });

  afterAll(() => subject.stop());

  it('exposes string and numeric values from a data block', async () => {
    await subject.createMock(`
      data "config" {
        greeting = "hello"
        count    = 42
      }
      mock "GET /data/string" {
        body = "{{data.config.greeting}}"
      }
      mock "GET /data/number" {
        body = "{{data.config.count}}"
      }
    `);
    expect((await subject.client.get('/data/string')).data).toBe('hello');
    expect(String((await subject.client.get('/data/number')).data)).toBe('42');
  });

  it('merges values from multiple data blocks', async () => {
    await subject.createMock(`
      data "a" {
        foo = "from-a"
      }
      data "b" {
        bar = "from-b"
      }
      mock "GET /data/multi-a" {
        body = "{{data.a.foo}}"
      }
      mock "GET /data/multi-b" {
        body = "{{data.b.bar}}"
      }
    `);
    expect((await subject.client.get('/data/multi-a')).data).toBe('from-a');
    expect((await subject.client.get('/data/multi-b')).data).toBe('from-b');
  });

  it('repeated nested blocks are accessible as an array', async () => {
    await subject.createMock(`
      data "users" {
        user {
          name = "John"
        }
        user {
          name = "Alice"
        }
      }
      mock "GET /data/nested-first" {
        body = "{{pick (itemAt data.users.user 0) 'name'}}"
      }
      mock "GET /data/nested-second" {
        body = "{{pick (itemAt data.users.user 1) 'name'}}"
      }
    `);
    expect((await subject.client.get('/data/nested-first')).data).toBe('John');
    expect((await subject.client.get('/data/nested-second')).data).toBe('Alice');
  });

  it('merges data from different files', async () => {
    await subject.createMock(`
      data "file1" {
        key1 = "value1"
      }
    `);
    await subject.createMock(`
      data "file2" {
        key2 = "value2"
      }
      mock "GET /data/cross-file1" {
        body = "{{data.file1.key1}}"
      }
      mock "GET /data/cross-file2" {
        body = "{{data.file2.key2}}"
      }
    `);
    expect((await subject.client.get('/data/cross-file1')).data).toBe('value1');
    expect((await subject.client.get('/data/cross-file2')).data).toBe('value2');
  });
});
