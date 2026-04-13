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
      subject = await createSubject(
        {},
        {
          DEPLOY_ENDPOINT_ENABLED: 'true',
          DEPLOY_AUTH_ENABLED: 'false',
        },
      );

      const res = await subject.client.post('/__mocko__/deploy', {
        mocks: [
          {
            method: 'GET',
            path: route,
            parse: true,
            response: {
              code: 200,
              body: 'from deploy',
              headers: {},
            },
          },
        ],
        hosts: [],
      });

      expect(res.status).toBe(204);
      expect((await subject.client.get(route)).data).toBe('from deploy');
    });

    it('rejects deploy without token when auth is enabled', async () => {
      subject = await createSubject(
        {},
        {
          DEPLOY_ENDPOINT_ENABLED: 'true',
          DEPLOY_SECRET: 'secret',
        },
      );

      const res = await subject.client.post('/__mocko__/deploy', {
        mocks: [],
        hosts: [],
      });

      expect(res.status).toBe(401);
    });

    it('rejects deploy with wrong token when auth is enabled', async () => {
      subject = await createSubject(
        {},
        {
          DEPLOY_ENDPOINT_ENABLED: 'true',
          DEPLOY_SECRET: 'secret',
        },
      );

      const res = await subject.client.post(
        '/__mocko__/deploy',
        { mocks: [], hosts: [] },
        { headers: { Authorization: 'Bearer wrong' } },
      );

      expect(res.status).toBe(401);
    });

    it('rejects mock management routes without token when auth is enabled', async () => {
      const route = randomPath();
      subject = await createSubject(
        {},
        {
          DEPLOY_SECRET: 'secret',
        },
      );

      await subject.createMock(`
        mock "GET ${route}" {
          body = "from file"
        }
      `);

      const listRes = await subject.client.get('/__mocko__/mocks');
      expect(listRes.status).toBe(401);

      const authListRes = await subject.client.get('/__mocko__/mocks', {
        headers: { Authorization: 'Bearer secret' },
      });
      expect(authListRes.status).toBe(200);

      const createdMock = authListRes.data.find(
        (mock: any) => mock.path === route,
      );
      expect(createdMock).toBeTruthy();

      const detailsRes = await subject.client.get(
        `/__mocko__/mocks/${createdMock.id}`,
      );
      expect(detailsRes.status).toBe(401);
    });

    it('allows mock management routes without token when auth is disabled', async () => {
      subject = await createSubject(
        {},
        {
          DEPLOY_AUTH_ENABLED: 'false',
        },
      );

      const res = await subject.client.get('/__mocko__/mocks');
      expect(res.status).toBe(200);
    });

    it('lists only file-defined hosts on host management route when auth is disabled', async () => {
      subject = await createSubject(
        { '--ui': true },
        {
          DEPLOY_ENDPOINT_ENABLED: 'true',
          DEPLOY_AUTH_ENABLED: 'false',
        },
      );

      await subject.createMock(`
        host "file-host" {
          name        = "File host"
          source      = "file-host.local"
          destination = "http://localhost:3000"
        }
      `);

      const deployRes = await subject.client.post('/__mocko__/deploy', {
        mocks: [],
        hosts: [
          {
            slug: 'deployed-host',
            name: 'Deployed host',
            source: 'deployed-host.local',
            destination: 'http://localhost:3001',
          },
        ],
      });
      expect(deployRes.status).toBe(204);

      const listRes = await subject.client.get('/__mocko__/hosts');
      expect(listRes.status).toBe(200);
      expect(
        listRes.data.map((host: any) => ({
          slug: host.slug,
          name: host.name,
        })),
      ).toEqual([{ slug: 'file-host', name: 'File host' }]);
    });

    it('requires auth for host management routes when auth is enabled', async () => {
      subject = await createSubject(
        { '--ui': true },
        {
          DEPLOY_SECRET: 'secret',
        },
      );

      const unauthorizedRes = await subject.client.get('/__mocko__/hosts');
      expect(unauthorizedRes.status).toBe(401);
    });

    it('replaces prior deployed state on a second deploy', async () => {
      const firstRoute = randomPath();
      const secondRoute = randomPath();
      subject = await createSubject(
        {},
        {
          DEPLOY_ENDPOINT_ENABLED: 'true',
          DEPLOY_AUTH_ENABLED: 'false',
        },
      );

      const firstDeploy = await subject.client.post('/__mocko__/deploy', {
        mocks: [
          {
            method: 'GET',
            path: firstRoute,
            parse: true,
            response: {
              code: 200,
              body: 'first',
              headers: {},
            },
          },
        ],
        hosts: [],
      });
      expect(firstDeploy.status).toBe(204);
      expect((await subject.client.get(firstRoute)).data).toBe('first');

      const secondDeploy = await subject.client.post('/__mocko__/deploy', {
        mocks: [
          {
            method: 'GET',
            path: secondRoute,
            parse: true,
            response: {
              code: 200,
              body: 'second',
              headers: {},
            },
          },
        ],
        hosts: [],
      });
      expect(secondDeploy.status).toBe(204);
      expect((await subject.client.get(firstRoute)).status).toBe(404);
      expect((await subject.client.get(secondRoute)).data).toBe('second');
    });

    it('keeps serving file mocks after invalid deploy attempts', async () => {
      const route = randomPath();
      subject = await createSubject(
        {},
        {
          DEPLOY_ENDPOINT_ENABLED: 'true',
          DEPLOY_AUTH_ENABLED: 'false',
        },
      );

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
          mocks: [
            {
              method: 'INVALID',
              path: '/bad-method',
              parse: true,
              response: {
                code: 200,
                body: 'bad',
                headers: {},
              },
            },
          ],
          hosts: [],
        },
        {
          mocks: [],
          hosts: [
            {
              slug: 'bad-host',
              source: 'not a hostname',
              destination: 'http://localhost:3000',
            },
          ],
        },
      ];

      for (const payload of invalidDeploys) {
        const deployRes = await subject.client.post(
          '/__mocko__/deploy',
          payload,
        );

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
