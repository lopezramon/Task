'use strict';

const path = require('node:path');

const serverDirectory = path.join(__dirname, 'server');

describe('backend scaffold', () => {
  test('provides the planned modules without runtime dependencies', () => {
    const packageManifest = require('./package.json');

    expect(packageManifest.dependencies).toBeUndefined();
    expect(() => require(path.join(serverDirectory, 'http.js'))).not.toThrow();
    expect(() => require(path.join(serverDirectory, 'tasks.js'))).not.toThrow();
    expect(() => require(path.join(serverDirectory, 'storage.js'))).not.toThrow();
    expect(typeof require(path.join(serverDirectory, 'index.js')).startServer).toBe('function');
  });

  test('starts an HTTP server on an ephemeral local port', async () => {
    const { startServer } = require(path.join(serverDirectory, 'index.js'));
    const server = await startServer({ host: '127.0.0.1', port: 0 });

    try {
      expect(server.listening).toBe(true);
      expect(server.address()).toEqual(
        expect.objectContaining({
          address: '127.0.0.1',
          port: expect.any(Number)
        })
      );
    } finally {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
