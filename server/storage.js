'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const STORE_VERSION = 1;

/**
 * Create accessors for the versioned task JSON file.
 * @param {{filePath: string}} options
 * @returns {{readTasks: () => Promise<Array<object>>, writeTasks: (tasks: Array<object>) => Promise<void>}}
 */
function createStorage({ filePath }) {
  if (typeof filePath !== 'string' || filePath.length === 0) {
    throw new TypeError('La ruta del archivo de tareas es obligatoria.');
  }

  /**
   * Read all tasks, initializing the store only when the file does not exist.
   * @returns {Promise<Array<object>>}
   */
  async function readTasks() {
    let content;
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      await writeTasks([]);
      return [];
    }

    let document;
    try {
      document = JSON.parse(content);
    } catch (cause) {
      throw new Error('El archivo de tareas contiene JSON inválido.', { cause });
    }

    if (!document || document.version !== STORE_VERSION || !Array.isArray(document.tasks)) {
      throw new Error('El formato o la versión del archivo de tareas no es compatible.');
    }

    return document.tasks;
  }

  /**
   * Atomically replace the task list with a versioned JSON document.
   * @param {Array<object>} tasks
   * @returns {Promise<void>}
   */
  async function writeTasks(tasks) {
    if (!Array.isArray(tasks)) {
      throw new TypeError('La lista de tareas debe ser un arreglo.');
    }

    const directory = path.dirname(filePath);
    const temporaryPath = path.join(directory, `.tasks-${randomUUID()}.tmp`);
    const serialized = `${JSON.stringify({ version: STORE_VERSION, tasks }, null, 2)}\n`;
    let temporaryCreated = false;

    try {
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(temporaryPath, serialized, { flag: 'wx' });
      temporaryCreated = true;
      await fs.rename(temporaryPath, filePath);
      temporaryCreated = false;
    } finally {
      if (temporaryCreated) {
        await fs.unlink(temporaryPath).catch((error) => {
          if (error.code !== 'ENOENT') {
            throw error;
          }
        });
      }
    }
  }

  return { readTasks, writeTasks };
}

module.exports = { createStorage };
