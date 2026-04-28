const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const { MockoClient } = require('../dist');

describe('MockoClient', () => {
  it('uses default ttl for raw setFlag and lets explicit ttl override it', async () => {
    const transport = recordingTransport();
    const client = new MockoClient('http://mocko.test', {
      defaultFlagTtl: 120,
      transport,
    });

    await client.setFlag('raw:default', 'active');
    await client.setFlag('raw:override', true, 10);

    assert.deepEqual(transport.calls, [
      ['set', 'raw:default', 'active', 120],
      ['set', 'raw:override', true, 10],
    ]);
  });

  it('calls transport correctly for raw getFlag and deleteFlag', async () => {
    const transport = recordingTransport({
      getFlag: async () => ({ status: 'active' }),
    });
    const client = new MockoClient('http://mocko.test', { transport });

    assert.deepEqual(await client.getFlag('raw:user:status'), {
      status: 'active',
    });
    await client.deleteFlag('raw:user:status');

    assert.deepEqual(transport.calls, [
      ['get', 'raw:user:status'],
      ['delete', 'raw:user:status'],
    ]);
  });
});

function recordingTransport(overrides = {}) {
  const transport = {
    calls: [],
    async getFlag(key) {
      transport.calls.push(['get', key]);
      if (overrides.getFlag) {
        return await overrides.getFlag(key);
      }

      return undefined;
    },
    async setFlag(key, value, ttl) {
      transport.calls.push(['set', key, value, ttl]);
    },
    async deleteFlag(key) {
      transport.calls.push(['delete', key]);
    },
  };

  return transport;
}
