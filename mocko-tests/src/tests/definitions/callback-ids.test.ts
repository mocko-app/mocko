import { createSubject, MockoInstance } from '../../harness';

type CoreCallback = {
  id: string;
  slug: string;
  url: string;
  filePath?: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

async function startWithCallbacks(): Promise<MockoInstance> {
  const subject = await createSubject();
  await subject.createMock(`
    host "dup" {
      source = "dup.local"
    }
    callback "dup" {
      url = "http://localhost:1/one"
    }
    callback "Dup" {
      url = "http://localhost:1/two"
    }
  `);
  await subject.createMock(`
    callback "dup" {
      url = "http://localhost:1/three"
    }
  `);
  return subject;
}

async function listCallbacksByUrl(
  subject: MockoInstance,
): Promise<Record<string, CoreCallback>> {
  const res = await subject.client.get('/__mocko__/callbacks');
  expect(res.status).toBe(200);
  return Object.fromEntries(
    res.data.map((callback: CoreCallback) => [callback.url, callback]),
  );
}

describe('file callback ids', () => {
  let subject: MockoInstance | null = null;

  afterEach(async () => {
    if (subject) {
      await subject.stop();
      subject = null;
    }
  });

  it('gives every file callback a distinct id, stable across restarts', async () => {
    subject = await startWithCallbacks();
    const first = await listCallbacksByUrl(subject);

    expect(Object.keys(first).sort()).toEqual([
      'http://localhost:1/one',
      'http://localhost:1/three',
      'http://localhost:1/two',
    ]);
    for (const callback of Object.values(first)) {
      expect(callback.id).toMatch(UUID_PATTERN);
    }
    expect(
      new Set(Object.values(first).map((callback) => callback.id)).size,
    ).toBe(3);
    expect(first['http://localhost:1/one'].filePath).toBe('mock-0.hcl');
    expect(first['http://localhost:1/three'].filePath).toBe('mock-1.hcl');

    const hostsRes = await subject.client.get('/__mocko__/hosts');
    const [host] = hostsRes.data;
    expect(Object.values(first).map((callback) => callback.id)).not.toContain(
      host.id,
    );

    await subject.stop();
    subject = await startWithCallbacks();
    const second = await listCallbacksByUrl(subject);

    for (const [url, callback] of Object.entries(first)) {
      expect(second[url].id).toBe(callback.id);
    }
  });
});
