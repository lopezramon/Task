'use strict';

const { createHttpServer } = require('./http');

/**
 * Start the task HTTP server.
 * @param {{host?: string, port?: number}} [options]
 * @returns {Promise<import('node:http').Server>}
 */
function startServer({ host = '127.0.0.1', port = 3000, ...serverOptions } = {}) {
  const server = createHttpServer(serverOptions);

  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve(server);
    };

    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, host);
  });
}

if (require.main === module) {
  const host = process.env.HOST || '127.0.0.1';
  const port = process.env.PORT === undefined ? 3000 : Number(process.env.PORT);

  startServer({ host, port })
    .then((server) => {
      const address = server.address();
      if (address && typeof address === 'object') {
        console.log(`Servidor disponible en http://${address.address}:${address.port}`);
      }
    })
    .catch((error) => {
      console.error('No se pudo iniciar el servidor:', error.message);
      process.exitCode = 1;
    });
}

module.exports = { startServer };
