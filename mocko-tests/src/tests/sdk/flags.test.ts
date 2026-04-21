import { MockoClient } from '@mocko/sdk';
import { createSubject, MockoInstance, randomPath } from '../../harness';

type UserProfile = {
  status: string;
  nested: {
    plan: string;
  };
};

describe('sdk flags', () => {
  let subject: MockoInstance;

  afterEach(async () => {
    if (subject) {
      await subject.stop();
    }
  });

  it('supports raw flag round trips against mocko core', async () => {
    subject = await createSdkSubject();
    const mocko = sdkClient(subject);
    const prefix = randomFlagPrefix();
    const stringFlagKey = `${prefix}:raw:user-123:status`;
    const objectFlagKey = `${prefix}:raw:user-123:profile`;
    const arrayFlagKey = `${prefix}:raw:user-123:roles`;
    const profile: UserProfile = {
      status: 'active',
      nested: {
        plan: 'pro',
      },
    };
    const roles = ['admin', 'reviewer'];

    expect(await mocko.getFlag<string>(stringFlagKey)).toBeUndefined();
    expect(await mocko.getFlag<UserProfile>(objectFlagKey)).toBeUndefined();
    expect(await mocko.getFlag<string[]>(arrayFlagKey)).toBeUndefined();

    await mocko.setFlag(stringFlagKey, 'active');
    await mocko.setFlag(objectFlagKey, profile);
    await mocko.setFlag(arrayFlagKey, roles);

    expect(await mocko.getFlag<string>(stringFlagKey)).toBe('active');
    expect(await mocko.getFlag<UserProfile>(objectFlagKey)).toEqual(profile);
    expect(await mocko.getFlag<string[]>(arrayFlagKey)).toEqual(roles);

    await mocko.deleteFlag(stringFlagKey);
    await mocko.deleteFlag(objectFlagKey);
    await mocko.deleteFlag(arrayFlagKey);

    expect(await mocko.getFlag<string>(stringFlagKey)).toBeUndefined();
    expect(await mocko.getFlag<UserProfile>(objectFlagKey)).toBeUndefined();
    expect(await mocko.getFlag<string[]>(arrayFlagKey)).toBeUndefined();
  });

  it('supports typed flag definitions against mocko core', async () => {
    subject = await createSdkSubject();
    const mocko = sdkClient(subject);
    const prefix = randomFlagPrefix();
    const profile: UserProfile = {
      status: 'active',
      nested: {
        plan: 'pro',
      },
    };
    const roles = ['admin', 'reviewer'];

    const featureEnabled = mocko
      .defineFlag<boolean>('SDK feature enabled')
      .pattern(`${prefix}:feature-enabled`);
    const userStatus = mocko
      .defineFlag<string>('SDK user status')
      .pattern(`${prefix}:users:{id}:status`);
    const userPreference = mocko
      .defineFlag<string>('SDK user preference')
      .pattern(`${prefix}:users:{id}:preferences:{preference}`);
    const userProfile = mocko
      .defineFlag<UserProfile>('SDK user profile')
      .pattern(`${prefix}:users:{id}:profile`);
    const userRoles = mocko
      .defineFlag<string[]>('SDK user roles')
      .pattern(`${prefix}:users:{id}:roles`);

    expect(featureEnabled.key()).toBe(`${prefix}:feature-enabled`);
    expect(userStatus.key('user-123')).toBe(`${prefix}:users:user-123:status`);
    expect(userPreference.key({ id: 'user-123', preference: 'language' })).toBe(
      `${prefix}:users:user-123:preferences:language`,
    );

    await featureEnabled.set(true);
    await userStatus.set('user-123', 'active');
    await userPreference
      .ttl(60)
      .set({ id: 'user-123', preference: 'language' }, 'en');
    await userProfile.set('user-123', profile);
    await userRoles.set('user-123', roles);

    expect(await featureEnabled.get()).toBe(true);
    expect(await userStatus.get('user-123')).toBe('active');
    expect(
      await userPreference.get({
        id: 'user-123',
        preference: 'language',
      }),
    ).toBe('en');
    expect(await userProfile.get('user-123')).toEqual(profile);
    expect(await userRoles.get('user-123')).toEqual(roles);

    await featureEnabled.delete();
    await userStatus.delete('user-123');
    await userPreference.delete({
      id: 'user-123',
      preference: 'language',
    });
    await userProfile.delete('user-123');
    await userRoles.delete('user-123');

    expect(await featureEnabled.get()).toBeUndefined();
    expect(await userStatus.get('user-123')).toBeUndefined();
    expect(
      await userPreference.get({
        id: 'user-123',
        preference: 'language',
      }),
    ).toBeUndefined();
    expect(await userProfile.get('user-123')).toBeUndefined();
    expect(await userRoles.get('user-123')).toBeUndefined();
  });

  it('exposes SDK-written flags to mock templates', async () => {
    subject = await createSdkSubject();
    const mocko = sdkClient(subject);
    const path = randomPath();
    const prefix = randomFlagPrefix();
    const profileKey = `${prefix}:template:profile`;
    const rolesKey = `${prefix}:template:roles`;

    await subject.createMock(`
      mock "GET ${path}" {
        headers {
          Content-Type = "application/json"
        }
        body = <<-EOF
          {
            "status": "{{pick (getFlag '${profileKey}') 'status'}}",
            "plan": "{{pick (pick (getFlag '${profileKey}') 'nested') 'plan'}}",
            "firstRole": "{{itemAt (getFlag '${rolesKey}') 0}}"
          }
        EOF
      }
    `);

    await mocko.setFlag<UserProfile>(profileKey, {
      status: 'active',
      nested: {
        plan: 'pro',
      },
    });
    await mocko.setFlag<string[]>(rolesKey, ['admin', 'reviewer']);

    const res = await subject.client.get(path);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({
      status: 'active',
      plan: 'pro',
      firstRole: 'admin',
    });
  });

  it('reads mock-written flags through the SDK', async () => {
    subject = await createSdkSubject();
    const mocko = sdkClient(subject);
    const path = randomPath();
    const prefix = randomFlagPrefix();
    const profileKey = `${prefix}:template:profile`;
    const rolesKey = `${prefix}:template:roles`;
    const profile: UserProfile = {
      status: 'active',
      nested: {
        plan: 'pro',
      },
    };
    const roles = ['admin', 'reviewer'];

    await subject.createMock(`
      mock "PUT ${path}" {
        body = <<-EOF
          {{setFlag '${profileKey}' request.body.profile}}
          {{setFlag '${rolesKey}' request.body.roles}}
          stored
        EOF
      }
    `);

    const res = await subject.client.put(path, {
      profile,
      roles,
    });

    expect(res.status).toBe(200);
    expect(await mocko.getFlag<UserProfile>(profileKey)).toEqual(profile);
    expect(await mocko.getFlag<string[]>(rolesKey)).toEqual(roles);
  });
});

async function createSdkSubject(): Promise<MockoInstance> {
  return await createSubject(
    {},
    {
      DEPLOY_AUTH_ENABLED: 'false',
    },
  );
}

function sdkClient(subject: MockoInstance): MockoClient {
  return new MockoClient(`http://127.0.0.1:${subject.port}`);
}

function randomFlagPrefix(): string {
  return `sdk:${Math.random().toString(36).slice(2, 10)}`;
}
