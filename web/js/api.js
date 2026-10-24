'use strict';

(function exposeTaskApi(root) {
  class ApiError extends Error {
    constructor(message, { status, code }) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.code = code;
    }
  }

  /**
   * Create a typed client for the task JSON API.
   * @param {{fetchImpl?: typeof fetch, baseUrl?: string}} [options]
   * @returns {{createTask: (task: object) => Promise<object>, listTasks: (filters?: object) => Promise<Array<object>>, updateTaskStatus: (id: string, status: string) => Promise<object>}}
   */
  function createApi({ fetchImpl = root.fetch.bind(root), baseUrl = '/api' } = {}) {
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');

    /**
     * Decode a successful API response or throw an error preserving the server message.
     * @param {Response} response
     * @returns {Promise<object>}
     */
    async function readResponse(response) {
      let body;
      try {
        body = await response.json();
      } catch {
        throw new ApiError('El servidor devolvió una respuesta JSON inválida.', {
          status: response.status,
          code: 'INVALID_RESPONSE'
        });
      }

      if (!response.ok) {
        const error = body && body.error;
        throw new ApiError(
          error && typeof error.message === 'string'
            ? error.message
            : `La solicitud falló (HTTP ${response.status}).`,
          {
            status: response.status,
            code: error && typeof error.code === 'string' ? error.code : 'HTTP_ERROR'
          }
        );
      }
      return body;
    }

    return {
      async createTask(task) {
        const response = await fetchImpl(`${normalizedBaseUrl}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task)
        });
        const body = await readResponse(response);
        return body.task;
      },

      async listTasks(filters = {}) {
        const parameters = new URLSearchParams();
        for (const key of ['status', 'from', 'to', 'name']) {
          const value = filters[key];
          if (typeof value === 'string' && value !== '') {
            parameters.set(key, value);
          }
        }
        const query = parameters.toString();
        const response = await fetchImpl(
          `${normalizedBaseUrl}/tasks${query ? `?${query}` : ''}`,
          { method: 'GET' }
        );
        const body = await readResponse(response);
        return body.tasks;
      },

      async updateTaskStatus(id, status) {
        const response = await fetchImpl(
          `${normalizedBaseUrl}/tasks/${encodeURIComponent(id)}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
          }
        );
        const body = await readResponse(response);
        return body.task;
      }
    };
  }

  const api = { ApiError, createApi };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.TaskApi = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
