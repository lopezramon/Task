'use strict';

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createStorage } = require('./storage');
const { startServer } = require('./index');

function dateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('task HTTP API', () => {
  let directory;
  let server;
  let baseUrl;

  async function launch(options = {}) {
    server = await startServer({
      host: '127.0.0.1',
      port: 0,
      storage: createStorage({ filePath: path.join(directory, 'tasks.json') }),
      ...options
    });
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  }

  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'task-api-'));
    await launch();
  });

  afterEach(async () => {
    if (server?.listening) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
    await fs.rm(directory, { recursive: true, force: true });
  });

  async function createTask(title, dueDate = dateAfter(1), description = '') {
    return fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, category: 'Work', due_date: dueDate })
    });
  }

  test('creates and persists tasks with the agreed JSON response', async () => {
    const description = 'x'.repeat(700);
    const response = await createTask('Prepare demo', dateAfter(1), description);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(response.headers.get('content-type')).toMatch(/application\/json; charset=utf-8/i);
    expect(body.task).toEqual(expect.objectContaining({
      title: 'Prepare demo',
      description,
      category: 'Work',
      status: 'backlog',
      completed_at: null
    }));

    const listResponse = await fetch(`${baseUrl}/api/tasks`);
    await expect(listResponse.json()).resolves.toEqual({ tasks: [body.task] });
  });

  test('returns validation errors as JSON for invalid creation and request bodies', async () => {
    const invalidTask = await createTask('');
    expect(invalidTask.status).toBe(400);
    await expect(invalidTask.json()).resolves.toEqual({
      error: expect.objectContaining({ code: 'VALIDATION_ERROR', message: expect.any(String) })
    });

    const malformed = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{'
    });
    expect(malformed.status).toBe(400);
    await expect(malformed.json()).resolves.toEqual({
      error: expect.objectContaining({ code: 'INVALID_JSON', message: expect.any(String) })
    });

    const oversized = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'x'.repeat(1024 * 1024 + 1) })
    });
    expect(oversized.status).toBe(413);
    await expect(oversized.json()).resolves.toEqual({
      error: expect.objectContaining({ code: 'PAYLOAD_TOO_LARGE', message: expect.any(String) })
    });
  });

  test('lists tasks ordered by due date and supports query filters', async () => {
    await createTask('Demo later', dateAfter(3));
    await createTask('DEMO first', dateAfter(1));
    await createTask('Report', dateAfter(2));

    const response = await fetch(`${baseUrl}/api/tasks?status=backlog&from=${dateAfter(1)}&to=${dateAfter(3)}&name=demo`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.tasks.map(({ title }) => title)).toEqual(['DEMO first', 'Demo later']);
    expect((await fetch(`${baseUrl}/api/tasks?status=invalid`)).status).toBe(400);
  });

  test('updates and reverts task status, including completion date', async () => {
    const created = await (await createTask('Status task')).json();
    const completedResponse = await fetch(`${baseUrl}/api/tasks/${created.task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' })
    });
    const completed = await completedResponse.json();
    expect(completedResponse.status).toBe(200);
    expect(completed.task).toEqual(expect.objectContaining({
      status: 'done',
      completed_at: expect.any(String)
    }));

    const reopenedResponse = await fetch(`${baseUrl}/api/tasks/${created.task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in progress' })
    });
    await expect(reopenedResponse.json()).resolves.toEqual({
      task: expect.objectContaining({ status: 'in progress', completed_at: null })
    });
  });

  test('returns not-found, validation and storage errors without success-shaped responses', async () => {
    const missing = await fetch(`${baseUrl}/api/tasks/absent`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' })
    });
    expect(missing.status).toBe(404);

    const invalidStatus = await createTask('Bad transition').then(async (response) => response.json());
    const invalid = await fetch(`${baseUrl}/api/tasks/${invalidStatus.task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'blocked' })
    });
    expect(invalid.status).toBe(400);

    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    server = undefined;
    await launch({
      storage: {
        readTasks: async () => [],
        writeTasks: async () => { throw new Error('disk failure'); }
      }
    });
    const storageFailure = await createTask('Cannot save');
    expect(storageFailure.status).toBe(500);
    await expect(storageFailure.json()).resolves.toEqual({
      error: expect.objectContaining({ code: 'INTERNAL_ERROR', message: expect.any(String) })
    });
  });

  test('serves static files from the configured web root', async () => {
    const webDirectory = path.join(directory, 'web');
    await fs.mkdir(path.join(webDirectory, 'js'), { recursive: true });
    await fs.writeFile(path.join(webDirectory, 'index.html'), '<h1>Task app</h1>');
    await fs.writeFile(path.join(webDirectory, 'js', 'app.js'), 'window.ready = true;');
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    server = undefined;
    await launch({ staticDirectory: webDirectory });

    const html = await fetch(baseUrl);
    expect(html.status).toBe(200);
    expect(await html.text()).toBe('<h1>Task app</h1>');
    const script = await fetch(`${baseUrl}/js/app.js`);
    expect(script.headers.get('content-type')).toMatch(/javascript/i);
    expect(await script.text()).toBe('window.ready = true;');
    expect((await fetch(`${baseUrl}/%2e%2e/package.json`)).status).toBe(404);
  });

  test('serves the implemented frontend assets from the default web root', async () => {
    const page = await fetch(baseUrl);
    const html = await page.text();
    expect(page.status).toBe(200);
    expect(html).toContain('Mis tareas');

    for (const assetPath of ['/styles.css', '/js/tasks.js', '/js/api.js', '/js/app.js']) {
      const asset = await fetch(`${baseUrl}${assetPath}`);
      expect(asset.status).toBe(200);
      expect(await asset.text()).not.toHaveLength(0);
    }
  });
});
