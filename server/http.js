'use strict';

const { createServer } = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createStorage } = require('./storage');
const {
  NotFoundError,
  ValidationError,
  createTask,
  listTasks,
  updateTaskStatus
} = require('./tasks');

/**
 * Read a bounded JSON request body.
 * @param {import('node:http').IncomingMessage} request
 * @returns {Promise<object>}
 */
async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1024 * 1024) {
      const error = new Error('El cuerpo de la solicitud supera el límite permitido.');
      error.code = 'PAYLOAD_TOO_LARGE';
      throw error;
    }
    chunks.push(chunk);
  }

  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (cause) {
    const error = new Error('El cuerpo de la solicitud debe contener JSON válido.', { cause });
    error.code = 'INVALID_JSON';
    throw error;
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    const error = new Error('El cuerpo JSON debe ser un objeto.');
    error.code = 'INVALID_JSON';
    throw error;
  }
  return body;
}

/**
 * Send a JSON response with the API content type.
 * @param {import('node:http').ServerResponse} response
 * @param {number} statusCode
 * @param {object} body
 * @returns {void}
 */
function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(JSON.stringify(body));
}

/**
 * Send a standard JSON error response.
 * @param {import('node:http').ServerResponse} response
 * @param {number} statusCode
 * @param {string} code
 * @param {string} message
 * @returns {void}
 */
function sendError(response, statusCode, code, message) {
  sendJson(response, statusCode, { error: { code, message } });
}

/**
 * Resolve and serve a static file without allowing paths outside the web root.
 * @param {import('node:http').IncomingMessage} request
 * @param {import('node:http').ServerResponse} response
 * @param {string} staticDirectory
 * @param {string} pathname
 * @returns {Promise<boolean>}
 */
async function serveStatic(request, response, staticDirectory, pathname) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return false;
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    sendError(response, 400, 'INVALID_PATH', 'La ruta solicitada no es válida.');
    return true;
  }

  const root = path.resolve(staticDirectory);
  const relativePath = decodedPath === '/' ? 'index.html' : decodedPath.replace(/^\/+/, '');
  const resolvedPath = path.resolve(root, relativePath);
  if (resolvedPath !== root && !resolvedPath.startsWith(`${root}${path.sep}`)) {
    sendError(response, 404, 'NOT_FOUND', 'Ruta no encontrada.');
    return true;
  }

  try {
    const file = await fs.readFile(resolvedPath);
    const extension = path.extname(resolvedPath).toLowerCase();
    const contentTypes = {
      '.css': 'text/css; charset=utf-8',
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.txt': 'text/plain; charset=utf-8'
    };
    response.writeHead(200, {
      'Content-Type': contentTypes[extension] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff'
    });
    response.end(request.method === 'HEAD' ? undefined : file);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EISDIR') {
      sendError(response, 404, 'NOT_FOUND', 'Ruta no encontrada.');
      return true;
    }
    throw error;
  }
}

/**
 * Create the task API server.
 * @param {{storage?: {readTasks: () => Promise<Array<object>>, writeTasks: (tasks: Array<object>) => Promise<void>}, dataFilePath?: string, staticDirectory?: string}} [options]
 * @returns {import('node:http').Server}
 */
function createHttpServer({
  storage,
  dataFilePath,
  staticDirectory = path.join(__dirname, '..', 'web')
} = {}) {
  const taskStorage = storage || createStorage({
    filePath: dataFilePath || path.join(__dirname, '..', 'data', 'tasks.json')
  });

  return createServer((request, response) => {
    handleRequest(request, response, { storage: taskStorage, staticDirectory })
      .catch((error) => {
        if (response.headersSent) {
          response.destroy(error);
          return;
        }
        if (error instanceof ValidationError || error instanceof NotFoundError) {
          sendError(response, error.statusCode, error.code, error.message);
          return;
        }
        if (error.code === 'INVALID_JSON' || error.code === 'PAYLOAD_TOO_LARGE') {
          sendError(response, error.code === 'PAYLOAD_TOO_LARGE' ? 413 : 400, error.code, error.message);
          return;
        }
        console.error('Error al procesar la solicitud:', error);
        sendError(response, 500, 'INTERNAL_ERROR', 'No se pudo completar la solicitud.');
      });
  });
}

/**
 * Route one HTTP request to the API or configured static directory.
 * @param {import('node:http').IncomingMessage} request
 * @param {import('node:http').ServerResponse} response
 * @param {{storage: {readTasks: () => Promise<Array<object>>, writeTasks: (tasks: Array<object>) => Promise<void>}, staticDirectory?: string}} options
 * @returns {Promise<void>}
 */
async function handleRequest(request, response, { storage, staticDirectory }) {
  let url;
  try {
    url = new URL(request.url, 'http://localhost');
  } catch {
    sendError(response, 400, 'INVALID_URL', 'La dirección solicitada no es válida.');
    return;
  }

  if (url.pathname === '/api/tasks' && request.method === 'POST') {
    const input = await readJsonBody(request);
    const task = createTask(input);
    const tasks = await storage.readTasks();
    tasks.push(task);
    await storage.writeTasks(tasks);
    sendJson(response, 201, { task });
    return;
  }

  if (url.pathname === '/api/tasks' && request.method === 'GET') {
    const filters = {
      status: url.searchParams.get('status') || undefined,
      from: url.searchParams.get('from') || undefined,
      to: url.searchParams.get('to') || undefined,
      name: url.searchParams.get('name') || undefined
    };
    const tasks = listTasks(await storage.readTasks(), filters);
    sendJson(response, 200, { tasks });
    return;
  }

  const taskMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)$/);
  if (taskMatch && request.method === 'PATCH') {
    let id;
    try {
      id = decodeURIComponent(taskMatch[1]);
    } catch {
      sendError(response, 400, 'INVALID_PATH', 'El identificador de tarea no es válido.');
      return;
    }
    const body = await readJsonBody(request);
    const tasks = await storage.readTasks();
    const task = updateTaskStatus(tasks, id, body.status);
    await storage.writeTasks(tasks.map((entry) => (entry.id === id ? task : entry)));
    sendJson(response, 200, { task });
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    sendError(response, 404, 'NOT_FOUND', 'Ruta no encontrada.');
    return;
  }

  if (staticDirectory && await serveStatic(request, response, staticDirectory, url.pathname)) {
    return;
  }
  sendError(response, 404, 'NOT_FOUND', 'Ruta no encontrada.');
}

module.exports = {
  createHttpServer,
  handleRequest,
  readJsonBody,
  sendError,
  sendJson
};
