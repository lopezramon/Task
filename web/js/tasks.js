'use strict';

(function exposeTaskPresentation(root) {
  const STATUSES = ['backlog', 'in progress', 'done'];
  const STATUS_LABELS = {
    backlog: 'Pendiente',
    'in progress': 'En progreso',
    done: 'Finalizada'
  };

  /**
   * Return a user-facing validation message or null for valid task input.
   * @param {{title?: string, description?: string, category?: string, due_date?: string}} input
   * @param {string} today
   * @returns {string|null}
   */
  function validateTaskInput(input, today) {
    if (!input || typeof input.title !== 'string' || input.title.trim() === '') {
      return 'El título es obligatorio.';
    }
    if (typeof input.category !== 'string' || input.category.trim() === '') {
      return 'La categoría es obligatoria.';
    }
    if (input.description !== undefined && typeof input.description !== 'string') {
      return 'La descripción debe ser texto.';
    }
    if (!isCalendarDate(input.due_date)) {
      return 'La fecha límite debe ser válida.';
    }
    if (input.due_date <= today) {
      return 'La fecha límite debe ser posterior a hoy.';
    }
    return null;
  }

  /**
   * Validate a YYYY-MM-DD calendar date without timezone conversion.
   * @param {unknown} value
   * @returns {value is string}
   */
  function isCalendarDate(value) {
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
   * Group tasks by category and status, sorting groups and tasks predictably.
   * @param {Array<object>} tasks
   * @returns {Array<{category: string, statuses: Array<{status: string, tasks: Array<object>}>}>}
   */
  function groupTasks(tasks) {
    const categories = new Map();
    for (const task of tasks) {
      if (!categories.has(task.category)) {
        categories.set(task.category, []);
      }
      categories.get(task.category).push(task);
    }

    return [...categories.entries()]
      .sort(([left], [right]) => left.localeCompare(right, 'es', { sensitivity: 'base' }))
      .map(([category, categoryTasks]) => ({
        category,
        statuses: STATUSES
          .map((status) => ({
            status,
            tasks: categoryTasks
              .filter((task) => task.status === status)
              .slice()
              .sort((left, right) => left.due_date.localeCompare(right.due_date))
          }))
          .filter(({ tasks: statusTasks }) => statusTasks.length > 0)
      }));
  }

  /**
   * Apply the supported task filters without changing the source array.
   * @param {Array<object>} tasks
   * @param {{status?: string, from?: string, to?: string, name?: string}} [filters]
   * @returns {Array<object>}
   */
  function filterTasks(tasks, filters = {}) {
    const { status, from, to, name } = filters;
    const searchTerm = (name || '').trim().toLocaleLowerCase();
    return tasks
      .filter((task) => !status || task.status === status)
      .filter((task) => !from || task.due_date >= from)
      .filter((task) => !to || task.due_date <= to)
      .filter((task) => !searchTerm || task.title.toLocaleLowerCase().includes(searchTerm))
      .slice()
      .sort((left, right) => left.due_date.localeCompare(right.due_date));
  }

  const presentation = {
    filterTasks,
    groupTasks,
    STATUS_LABELS,
    STATUSES,
    validateTaskInput
  };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = presentation;
  }
  root.TaskPresentation = presentation;
})(typeof globalThis !== 'undefined' ? globalThis : window);
