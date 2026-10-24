'use strict';

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createStorage } = require('./storage');

describe('task JSON storage', () => {
  let directory;
  let filePath;
  let storage;

  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'task-storage-'));
    filePath = path.join(directory, 'data', 'tasks.json');
    storage = createStorage({ filePath });
  });

  afterEach(async () => {
    await fs.rm(directory, { recursive: true, force: true });
  });

  test('initializes a versioned empty store only when the file is absent', async () => {
    await expect(storage.readTasks()).resolves.toEqual([]);
    await expect(fs.readFile(filePath, 'utf8')).resolves.toBe(
      `${JSON.stringify({ version: 1, tasks: [] }, null, 2)}\n`
    );
  });

  test('reads tasks from a valid versioned store', async () => {
    const tasks = [{ id: 'task-1', title: 'Prepare demo' }];
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify({ version: 1, tasks }));

    await expect(storage.readTasks()).resolves.toEqual(tasks);
  });

  test('rejects corrupt or unsupported data without replacing it', async () => {
    const original = '{"version":1,"tasks":';
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, original);

    await expect(storage.readTasks()).rejects.toThrow();
    await expect(fs.readFile(filePath, 'utf8')).resolves.toBe(original);

    await fs.writeFile(filePath, JSON.stringify({ version: 2, tasks: [] }));
    await expect(storage.readTasks()).rejects.toThrow(/versión/i);
  });

  test('writes JSON using a same-directory temporary file and keeps it readable', async () => {
    const tasks = [{ id: 'task-1', title: 'Prepare demo' }];

    await storage.writeTasks(tasks);

    await expect(storage.readTasks()).resolves.toEqual(tasks);
    await expect(fs.readdir(path.dirname(filePath))).resolves.toEqual(['tasks.json']);
  });

  test('propagates write errors and preserves the previous valid file', async () => {
    await storage.writeTasks([{ id: 'original' }]);
    const original = await fs.readFile(filePath, 'utf8');
    const rename = jest.spyOn(fs, 'rename').mockRejectedValue(new Error('disk failure'));

    try {
      await expect(storage.writeTasks([{ id: 'replacement' }])).rejects.toThrow('disk failure');
      await expect(fs.readFile(filePath, 'utf8')).resolves.toBe(original);
      await expect(fs.readdir(path.dirname(filePath))).resolves.toEqual(['tasks.json']);
    } finally {
      rename.mockRestore();
    }
  });
});
