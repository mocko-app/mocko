const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const { MockoClient } = require('../../dist');

describe('typed flag definitions', () => {
  it('resolves zero-param flags and calls raw operations', async () => {
    const client = recordingClient();
    const flag = client
      .defineFlag('Feature enabled')
      .pattern('features:new-checkout');

    assert.equal(flag.key(), 'features:new-checkout');

    await flag.set(true);
    await flag.get();
    await flag.delete();

    assert.deepEqual(client.calls, [
      ['set', 'features:new-checkout', true, undefined],
      ['get', 'features:new-checkout'],
      ['delete', 'features:new-checkout'],
    ]);
  });

  it('resolves one-param flags and calls raw operations', async () => {
    const client = recordingClient();
    const flag = client.defineFlag('User status').pattern('users:{id}:status');

    assert.equal(flag.key('user-123'), 'users:user-123:status');

    await flag.set('user-123', 'active');
    await flag.get('user-123');
    await flag.delete('user-123');

    assert.deepEqual(client.calls, [
      ['set', 'users:user-123:status', 'active', undefined],
      ['get', 'users:user-123:status'],
      ['delete', 'users:user-123:status'],
    ]);
  });

  it('resolves multi-param flags and calls raw operations', async () => {
    const client = recordingClient();
    const flag = client
      .defineFlag('User preference')
      .pattern('users:{id}:preferences:{preference}');

    const params = { id: 'user-123', preference: 'language' };

    assert.equal(flag.key(params), 'users:user-123:preferences:language');

    await flag.set(params, 'en');
    await flag.get(params);
    await flag.delete(params);

    assert.deepEqual(client.calls, [
      ['set', 'users:user-123:preferences:language', 'en', undefined],
      ['get', 'users:user-123:preferences:language'],
      ['delete', 'users:user-123:preferences:language'],
    ]);
  });

  it('passes typed flag ttl only to typed set operations', async () => {
    const client = recordingClient();
    const flag = client
      .defineFlag('User preference')
      .pattern('users:{id}:preferences:{preference}')
      .ttl(30);

    await flag.set({ id: 'user-123', preference: 'language' }, 'en');
    await flag.get({ id: 'user-123', preference: 'language' });

    assert.deepEqual(client.calls, [
      ['set', 'users:user-123:preferences:language', 'en', 30],
      ['get', 'users:user-123:preferences:language'],
    ]);
  });

  it('returns a new flag definition when overriding ttl', async () => {
    const client = recordingClient();
    const flag = client.defineFlag('Feature').pattern('features:test');
    const shortLivedFlag = flag.ttl(10);

    await flag.set(true);
    await shortLivedFlag.set(false);

    assert.deepEqual(client.calls, [
      ['set', 'features:test', true, undefined],
      ['set', 'features:test', false, 10],
    ]);
  });

  it('throws descriptive errors for invalid key arguments', () => {
    const client = recordingClient();
    const flag = client
      .defineFlag('User preference')
      .pattern('users:{id}:preferences:{preference}');

    assert.throws(
      () => flag.key({ id: 'user-123' }),
      /Mocko flag "User preference" missing string parameter "preference"/,
    );
    assert.throws(
      () => flag.key('user-123', 'language'),
      /Mocko flag "User preference" expected 1 parameter\(s\)/,
    );
  });

  it('throws descriptive errors for invalid flag patterns', () => {
    const client = recordingClient();

    assert.throws(
      () => client.defineFlag('Empty').pattern(''),
      /Mocko flag "Empty" pattern is required/,
    );
    assert.throws(
      () => client.defineFlag('Bad sections').pattern('users::status'),
      /Mocko flag "Bad sections" pattern cannot start or end with ':' or contain empty sections like '::'/,
    );
    assert.throws(
      () => client.defineFlag('Unnamed').pattern('users:{}:status'),
      /Mocko flag "Unnamed" pattern placeholders must be named/,
    );
  });
});

function recordingClient() {
  const client = new MockoClient('http://mocko.test');
  client.calls = [];
  client.getFlag = async (key) => {
    client.calls.push(['get', key]);
    return undefined;
  };
  client.setFlag = async (key, value, ttl) => {
    client.calls.push(['set', key, value, ttl]);
  };
  client.deleteFlag = async (key) => {
    client.calls.push(['delete', key]);
  };

  return client;
}
