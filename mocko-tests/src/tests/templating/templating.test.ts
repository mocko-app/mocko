import { createSubject, MockoInstance, randomPath } from '../../harness';

describe('templating helpers', () => {
  let subject: MockoInstance;

  beforeAll(async () => {
    subject = await createSubject();
  });

  afterAll(async () => {
    await subject.stop();
  });

  it('allows the usage of bigodon helpers', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        body = "{{capitalizeAll 'foo'}}"
      }
    `);

    const res = await subject.client.get(path);
    expect(res.data).toContain('Foo');
  });

  it('uuid returns a valid UUID v4', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        body = "{{uuid}}"
      }
    `);

    const res = await subject.client.get(path);
    expect(res.data).toMatch(
      /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i,
    );
  });

  it('substring works with 2 params', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        body = "{{substring 'Lorem ipsum' 0 4}}"
      }
    `);

    const res = await subject.client.get(path);
    expect(res.data).toBe('Lore');
  });

  it('substring works with 1 param', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        body = "{{substring 'Lorem ipsum' 8}}"
      }
    `);

    const res = await subject.client.get(path);
    expect(res.data).toBe('sum');
  });
});
