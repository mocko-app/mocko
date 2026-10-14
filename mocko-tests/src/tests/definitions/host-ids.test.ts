import { createSubject, MockoInstance } from '../../harness';

type CoreHost = {
  id: string;
  slug: string;
  source: string;
  filePath?: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

async function startWithHosts(): Promise<MockoInstance> {
  const subject = await createSubject();
  await subject.createMock(`
    host "dup" {
      source = "dup-one.local"
    }
    host "Dup" {
      source = "dup-two.local"
    }
  `);
  await subject.createMock(`
    host "dup" {
      source = "dup-three.local"
    }
  `);
  return subject;
}

async function listHostsBySource(
  subject: MockoInstance,
): Promise<Record<string, CoreHost>> {
  const res = await subject.client.get('/__mocko__/hosts');
  expect(res.status).toBe(200);
  return Object.fromEntries(
    res.data.map((host: CoreHost) => [host.source, host]),
  );
}

describe('file host ids', () => {
  let subject: MockoInstance | null = null;

  afterEach(async () => {
    if (subject) {
      await subject.stop();
      subject = null;
    }
  });

  it('gives every file host a distinct id and its file path, stable across restarts', async () => {
    subject = await startWithHosts();
    const first = await listHostsBySource(subject);

    expect(Object.keys(first).sort()).toEqual([
      'dup-one.local',
      'dup-three.local',
      'dup-two.local',
    ]);
    for (const host of Object.values(first)) {
      expect(host.id).toMatch(UUID_PATTERN);
    }
    expect(new Set(Object.values(first).map((host) => host.id)).size).toBe(3);
    expect(first['dup-one.local'].filePath).toBe('mock-0.hcl');
    expect(first['dup-two.local'].filePath).toBe('mock-0.hcl');
    expect(first['dup-three.local'].filePath).toBe('mock-1.hcl');

    await subject.stop();
    subject = await startWithHosts();
    const second = await listHostsBySource(subject);

    for (const [source, host] of Object.entries(first)) {
      expect(second[source].id).toBe(host.id);
    }
  });
});
