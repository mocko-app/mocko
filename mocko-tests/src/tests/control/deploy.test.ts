import { createSubject, MockoInstance, randomPath } from '../../harness';

describe('deploy endpoint', () => {
  describe('direct deploy behavior', () => {
    let subject: MockoInstance;

    afterEach(async () => {
      if (subject) {
        await subject.stop();
      }
    });

    it('serves deployed mocks when deploy auth is disabled', async () => {
      const route = randomPath();
      subject = await createSubject({}, {
        DEPLOY_ENDPOINT_ENABLED: 'true',
        DEPLOY_AUTH_ENABLED: 'false',
      });

      const res = await subject.client.post('/__mocko__/deploy', {
        mocks: [{
          method: 'GET',
          path: route,
          parse: true,
          response: {
            code: 200,
            body: 'from deploy',
            headers: {},
          },
        }],
        hosts: [],
      });

      expect(res.status).toBe(204);
      expect((await subject.client.get(route)).data).toBe('from deploy');
    });

    it('rejects deploy without token when auth is enabled', async () => {
      subject = await createSubject({}, {
        DEPLOY_ENDPOINT_ENABLED: 'true',
        DEPLOY_SECRET: 'secret',
      });

      const res = await subject.client.post('/__mocko__/deploy', {
        mocks: [],
        hosts: [],
      });

      expect(res.status).toBe(401);
    });

    it('rejects deploy with wrong token when auth is enabled', async () => {
      subject = await createSubject({}, {
        DEPLOY_ENDPOINT_ENABLED: 'true',
        DEPLOY_SECRET: 'secret',
      });

      const res = await subject.client.post(
        '/__mocko__/deploy',
        { mocks: [], hosts: [] },
        { headers: { Authorization: 'Bearer wrong' } },
      );

      expect(res.status).toBe(401);
    });

    it('replaces prior deployed state on a second deploy', async () => {
      const firstRoute = randomPath();
      const secondRoute = randomPath();
      subject = await createSubject({}, {
        DEPLOY_ENDPOINT_ENABLED: 'true',
        DEPLOY_AUTH_ENABLED: 'false',
      });

      const firstDeploy = await subject.client.post('/__mocko__/deploy', {
        mocks: [{
          method: 'GET',
          path: firstRoute,
          parse: true,
          response: {
            code: 200,
            body: 'first',
            headers: {},
          },
        }],
        hosts: [],
      });
      expect(firstDeploy.status).toBe(204);
      expect((await subject.client.get(firstRoute)).data).toBe('first');

      const secondDeploy = await subject.client.post('/__mocko__/deploy', {
        mocks: [{
          method: 'GET',
          path: secondRoute,
          parse: true,
          response: {
            code: 200,
            body: 'second',
            headers: {},
          },
        }],
        hosts: [],
      });
      expect(secondDeploy.status).toBe(204);
      expect((await subject.client.get(firstRoute)).status).toBe(404);
      expect((await subject.client.get(secondRoute)).data).toBe('second');
    });

    it('keeps serving file mocks after invalid deploy attempts', async () => {
      const route = randomPath();
      subject = await createSubject({}, {
        DEPLOY_ENDPOINT_ENABLED: 'true',
        DEPLOY_AUTH_ENABLED: 'false',
      });

      await subject.createMock(`
        mock "GET ${route}" {
          body = "from file"
        }
      `);

      const invalidDeploys = [
        {
          mocks: [],
        },
        {
          mocks: [{
            method: 'INVALID',
            path: '/bad-method',
            parse: true,
            response: {
              code: 200,
              body: 'bad',
              headers: {},
            },
          }],
          hosts: [],
        },
        {
          mocks: [],
          hosts: [{
            name: 'bad-host',
            source: 'not a hostname',
            destination: 'http://localhost:3000',
          }],
        },
      ];

      for (const payload of invalidDeploys) {
        const deployRes = await subject.client.post('/__mocko__/deploy', payload);

        expect(deployRes.status).toBe(400);
        expect((await subject.client.get(route)).data).toBe('from file');
      }
    });
  });

  describe('cli ui wiring', () => {
    let subject: MockoInstance;

    afterEach(async () => {
      if (subject) {
        await subject.stop();
      }
    });

    it('returns 404 without ui flags', async () => {
      subject = await createSubject();

      const res = await subject.client.post('/__mocko__/deploy', {
        mocks: [],
        hosts: [],
      });

      expect(res.status).toBe(404);
    });

    it('enables deploy endpoint with --ui', async () => {
      subject = await createSubject({ '--ui': true });

      const res = await subject.client.post('/__mocko__/deploy', {
        mocks: [],
        hosts: [],
      });

      expect(res.status).toBe(401);
    });

    it('enables deploy endpoint with --ui-port', async () => {
      subject = await createSubject({ '--ui-port': 7788 });
      const res = await subject.client.post('/__mocko__/deploy', {
        mocks: [],
        hosts: [],
      });

      expect(res.status).toBe(401);
    });

    it('enables deploy endpoint when both ui flags are present', async () => {
      subject = await createSubject({ '--ui': true, '--ui-port': 7799 });
      const res = await subject.client.post('/__mocko__/deploy', {
        mocks: [],
        hosts: [],
      });

      expect(res.status).toBe(401);
    });
  });
});
