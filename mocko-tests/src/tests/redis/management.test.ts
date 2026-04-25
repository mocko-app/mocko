import {
  createRedisSubject,
  describeRedis,
  MockoInstance,
  RedisTestConfig,
  flushRedis,
} from '../../harness';

jest.setTimeout(45000);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describeRedis('redis management operations', () => {
  let subject: MockoInstance | null = null;
  let redis: RedisTestConfig | null = null;

  afterEach(async () => {
    if (subject) {
      await subject.stop();
      subject = null;
    }
    if (redis) {
      await flushRedis(redis);
      redis = null;
    }
  });

  it('purges stale flags and preserves recent flags', async () => {
    ({ subject, redis } = await createRedisSubject({
      options: { '--ui': true, '--watch': false },
      mode: 'url',
    }));

    const control = subject.ensureControl();
    const prefix = randomFlagPrefix();
    const oldA = `${prefix}:old:a`;
    const oldB = `${prefix}:old:b`;
    const recentA = `${prefix}:recent:a`;
    const recentB = `${prefix}:recent:b`;

    await putFlag(subject, oldA, '"old-a"');
    await putFlag(subject, oldB, '"old-b"');
    await sleep(3100);
    await putFlag(subject, recentA, '"recent-a"');
    await putFlag(subject, recentB, '"recent-b"');

    const createRes = await control.post('/api/operations', {
      type: 'STALE_FLAGS',
      staleFlagsData: { thresholdSeconds: 2 },
    });
    expect(createRes.status).toBe(201);
    expect(createRes.data.status).toBe('SCANNING');

    const readyOperation = await waitForOperation(
      subject,
      createRes.data.id,
      'READY',
    );
    expect(readyOperation.staleFlagsData.scannedCount).toBe(4);
    expect(readyOperation.staleFlagsData.staleFlags).toBe(2);

    const executeRes = await control.patch(
      `/api/operations/${createRes.data.id}`,
      { status: 'EXECUTING' },
    );
    expect(executeRes.status).toBe(200);

    const doneOperation = await waitForOperation(
      subject,
      createRes.data.id,
      'DONE',
    );
    expect(doneOperation.staleFlagsData.purgedCount).toBe(2);

    expect((await getFlag(subject, oldA)).status).toBe(404);
    expect((await getFlag(subject, oldB)).status).toBe(404);
    expect((await getFlag(subject, recentA)).status).toBe(200);
    expect((await getFlag(subject, recentB)).status).toBe(200);
  });

  it('cancels a READY operation without purging stale flags', async () => {
    ({ subject, redis } = await createRedisSubject({
      options: { '--ui': true, '--watch': false },
      mode: 'url',
    }));

    const control = subject.ensureControl();
    const flagKey = `${randomFlagPrefix()}:cancel`;

    await putFlag(subject, flagKey, '"stale"');
    await sleep(3100);

    const createRes = await control.post('/api/operations', {
      type: 'STALE_FLAGS',
      staleFlagsData: { thresholdSeconds: 2 },
    });
    expect(createRes.status).toBe(201);

    await waitForOperation(subject, createRes.data.id, 'READY');

    const deleteRes = await control.delete(
      `/api/operations/${createRes.data.id}`,
    );
    expect(deleteRes.status).toBe(204);

    const operationsRes = await control.get('/api/operations');
    expect(operationsRes.status).toBe(200);
    expect(
      operationsRes.data.operations.some(
        (operation: any) => operation.id === createRes.data.id,
      ),
    ).toBe(false);
    expect((await getFlag(subject, flagKey)).status).toBe(200);
  });

  it('removes a DONE operation', async () => {
    ({ subject, redis } = await createRedisSubject({
      options: { '--ui': true, '--watch': false },
      mode: 'url',
    }));

    const control = subject.ensureControl();
    const flagKey = `${randomFlagPrefix()}:done`;

    await putFlag(subject, flagKey, '"stale"');
    await sleep(3100);

    const createRes = await control.post('/api/operations', {
      type: 'STALE_FLAGS',
      staleFlagsData: { thresholdSeconds: 2 },
    });
    await waitForOperation(subject, createRes.data.id, 'READY');

    await control.patch(`/api/operations/${createRes.data.id}`, {
      status: 'EXECUTING',
    });
    await waitForOperation(subject, createRes.data.id, 'DONE');

    const deleteRes = await control.delete(
      `/api/operations/${createRes.data.id}`,
    );
    expect(deleteRes.status).toBe(204);

    const operationsRes = await control.get('/api/operations');
    expect(operationsRes.status).toBe(200);
    expect(
      operationsRes.data.operations.some(
        (operation: any) => operation.id === createRes.data.id,
      ),
    ).toBe(false);
  });

  it('deletes missing operations idempotently', async () => {
    ({ subject, redis } = await createRedisSubject({
      options: { '--ui': true, '--watch': false },
      mode: 'url',
    }));

    const deleteRes = await subject
      .ensureControl()
      .delete('/api/operations/missing-operation');
    expect(deleteRes.status).toBe(204);
  });
});

async function putFlag(subject: MockoInstance, key: string, value: string) {
  return await subject
    .ensureControl()
    .put(`/api/flags/${encodeURIComponent(key)}`, {
      value,
    });
}

async function getFlag(subject: MockoInstance, key: string) {
  return await subject
    .ensureControl()
    .get(`/api/flags/${encodeURIComponent(key)}`);
}

async function waitForOperation(
  subject: MockoInstance,
  id: string,
  status: string,
) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const res = await subject.ensureControl().get('/api/operations');
    expect(res.status).toBe(200);
    const operation = res.data.operations.find((item: any) => item.id === id);
    if (operation?.status === status) {
      return operation;
    }
    await sleep(100);
  }

  throw new Error(`Timed out waiting for operation ${id} to become ${status}`);
}

function randomFlagPrefix(): string {
  return `management:${Math.random().toString(36).slice(2, 10)}`;
}
