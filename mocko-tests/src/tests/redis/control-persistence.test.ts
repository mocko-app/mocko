import {
  createRedisSubject,
  describeRedis,
  flushRedis,
  MockoInstance,
  randomPath,
  RedisTestConfig,
} from '../../harness';

describeRedis('redis control persistence', () => {
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

  it('persists control-created mocks across restart and still merges file mocks', async () => {
    const route = randomPath();
    const fileRoute = randomPath();

    ({ subject, redis } = await createRedisSubject({
      options: { '--ui': true },
      mode: 'url',
    }));

    const control = subject.ensureControl();
    const createRes = await control.post('/api/mocks', {
      name: 'redis mock',
      method: 'GET',
      path: route,
      response: {
        code: 200,
        body: 'persisted',
        headers: {},
      },
    });
    expect(createRes.status).toBe(201);
    const createdMock = createRes.data;

    const updateRes = await control.patch(`/api/mocks/${createdMock.id}`, {
      response: {
        code: 202,
        body: 'updated after redis',
      },
    });
    expect(updateRes.status).toBe(200);

    const disableRes = await control.patch(`/api/mocks/${createdMock.id}`, {
      isEnabled: false,
    });
    expect(disableRes.status).toBe(200);
    expect((await subject.client.get(route)).status).toBe(404);

    const enableRes = await control.patch(`/api/mocks/${createdMock.id}`, {
      isEnabled: true,
    });
    expect(enableRes.status).toBe(200);
    expect((await subject.client.get(route)).status).toBe(202);

    await subject.stop();
    subject = null;

    ({ subject } = await createRedisSubject({
      options: { '--ui': true },
      mode: 'url',
      redis,
    }));

    const restartedControl = subject.ensureControl();
    const detailsRes = await restartedControl.get(
      `/api/mocks/${createdMock.id}`,
    );
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.response.code).toBe(202);
    expect(detailsRes.data.response.body).toBe('updated after redis');
    expect((await subject.client.get(route)).data).toBe('updated after redis');

    await subject.createMock(`
      mock "GET ${fileRoute}" {
        body = "from file"
      }
    `);

    const listRes = await restartedControl.get('/api/mocks');
    expect(listRes.status).toBe(200);
    expect(listRes.data.some((mock: any) => mock.id === createdMock.id)).toBe(
      true,
    );
    expect(
      listRes.data.some(
        (mock: any) =>
          mock.path === fileRoute && mock.annotations.includes('READ_ONLY'),
      ),
    ).toBe(true);

    const deleteRes = await restartedControl.delete(
      `/api/mocks/${createdMock.id}`,
    );
    expect(deleteRes.status).toBe(204);
    expect((await subject.client.get(route)).status).toBe(404);

    await subject.stop();
    subject = null;

    ({ subject } = await createRedisSubject({
      options: { '--ui': true },
      mode: 'url',
      redis,
    }));

    expect(
      (await subject.ensureControl().get(`/api/mocks/${createdMock.id}`))
        .status,
    ).toBe(404);
  });
});
