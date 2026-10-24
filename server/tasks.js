'use strict';

const { randomUUID } = require('node:crypto');

const STATUSES = new Set(['backlog', 'in progress', 'done']);

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
    this.statusCode = 400;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.code = 'NOT_FOUND';
    this.statusCode = 404;
  }
}

/**
 * Check whether a value is a real calendar date in YYYY-MM-DD format.
 * @param {unknown} value
 * @returns {value is string}
 */
function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

/**
 * Format today's local calendar date.
 * @param {Date} date
 * @returns {string}
 */
function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Create a task after validating its user-provided fields.
 * @param {{title: string, description?: string, category: string, due_date: string}} input
 * @param {{today?: string, idFactory?: () => string, createdAt?: string}} [options]
 * @returns {object}
 */
function createTask(input, { today = localDateString(new Date()), idFactory = randomUUID, createdAt = today } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ValidationError('Los datos de la tarea no son válidos.');
  }
  if (typeof input.title !== 'string' || input.title.trim().length === 0) {
    throw new ValidationError('El título es obligatorio.');
  }
  if (typeof input.category !== 'string' || input.category.trim().length === 0) {
    throw new ValidationError('La categoría es obligatoria.');
  }
  if (input.description !== undefined && typeof input.description !== 'string') {
    throw new ValidationError('La descripción debe ser texto.');
  }
  if (!isIsoDate(today) || !isIsoDate(input.due_date)) {
    throw new ValidationError('La fecha límite debe ser una fecha válida.');
  }
  if (input.due_date <= today) {
    throw new ValidationError('La fecha límite debe ser posterior a hoy.');
  }

  return {
    id: idFactory(),
    title: input.title.trim(),
    description: input.description === undefined ? '' : input.description,
    category: input.category.trim(),
    due_date: input.due_date,
    status: 'backlog',
    created_at: createdAt,
    completed_at: null
  };
}

/**
 * Change a task status and maintain its completion date.
 * @param {Array<object>} tasks
 * @param {string} id
 * @param {string} status
 * @param {{today?: string}} [options]
 * @returns {object}
 */
function updateTaskStatus(tasks, id, status, { today = localDateString(new Date()) } = {}) {
  if (!STATUSES.has(status)) {
    throw new ValidationError('El estatus seleccionado no es válido.');
  }
  const task = tasks.find((candidate) => candidate.id === id);
  if (!task) {
    throw new NotFoundError('No se encontró la tarea solicitada.');
  }
  if (status === 'done' && !isIsoDate(today)) {
    throw new TypeError('La fecha actual debe tener formato YYYY-MM-DD.');
  }

  const updatedTask = {
    ...task,
    status,
    completed_at: status === 'done' ? today : null
  };
  return updatedTask;
}

/**
 * Filter and sort tasks by the supported query fields.
 * @param {Array<object>} tasks
 * @param {{status?: string, from?: string, to?: string, name?: string}} [filters]
 * @returns {Array<object>}
 */
function listTasks(tasks, filters = {}) {
  const { status, from, to, name } = filters;
  if (status !== undefined && status !== '' && !STATUSES.has(status)) {
    throw new ValidationError('El filtro de estatus no es válido.');
  }
  if (from !== undefined && from !== '' && !isIsoDate(from)) {
    throw new ValidationError('La fecha inicial del filtro no es válida.');
  }
  if (to !== undefined && to !== '' && !isIsoDate(to)) {
    throw new ValidationError('La fecha final del filtro no es válida.');
  }
  if (from && to && from > to) {
    throw new ValidationError('La fecha inicial no puede ser posterior a la fecha final.');
  }
  if (name !== undefined && typeof name !== 'string') {
    throw new ValidationError('El filtro por nombre debe ser texto.');
  }

  const searchTerm = (name || '').trim().toLocaleLowerCase();
  return tasks
    .filter((task) => !status || task.status === status)
    .filter((task) => !from || task.due_date >= from)
    .filter((task) => !to || task.due_date <= to)
    .filter((task) => !searchTerm || task.title.toLocaleLowerCase().includes(searchTerm))
    .slice()
    .sort((left, right) => left.due_date.localeCompare(right.due_date));
}

module.exports = {
  ValidationError,
  NotFoundError,
  createTask,
  isIsoDate,
  listTasks,
  updateTaskStatus
};
