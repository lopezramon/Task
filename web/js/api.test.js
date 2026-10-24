'use strict';

const { ApiError, createApi } = require('./api');

describe('task API client', () => {
  test('sends create, list, and status requests using the backend JSON contract', async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ task: { id: 'task/1' } }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ tasks: [] }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ task: { status: 'done' } }) });
    const api = createApi({ fetchImpl, baseUrl: '/api' });

    await expect(api.createTask({
      title: 'Prepare demo',
      description: 'Details',
      category: 'Work',
      due_date: '2026-11-05'
    })).resolves.toEqual({ id: 'task/1' });
    await expect(api.listTasks({
      status: 'backlog',
      from: '2026-10-24',
      to: '2026-11-30',
      name: 'demo'
    })).resolves.toEqual([]);
    await expect(api.updateTaskStatus('task/1', 'done')).resolves.toEqual({ status: 'done' });

    expect(fetchImpl.mock.calls.map(([url, options]) => [url, options.method])).toEqual([
      ['/api/tasks', 'POST'],
      ['/api/tasks?status=backlog&from=2026-10-24&to=2026-11-30&name=demo', 'GET'],
      ['/api/tasks/task%2F1', 'PATCH']
    ]);
    expect(fetchImpl.mock.calls[0][1].body).toBe(JSON.stringify({
      title: 'Prepare demo',
      description: 'Details',
      category: 'Work',
      due_date: '2026-11-05'
    }));
    expect(JSON.parse(fetchImpl.mock.calls[2][1].body)).toEqual({ status: 'done' });
  });

  test('turns backend JSON errors into ApiError with status and code', async () => {
    const api = createApi({
      fetchImpl: async () => ({
        ok: false,
        status: 400,
        json: async () => ({
          error: { code: 'VALIDATION_ERROR', message: 'La fecha no es válida.' }
        })
      })
    });

    await expect(api.createTask({})).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'La fecha no es válida.'
    });
    expect(ApiError).toBeDefined();
  });

  test('does not convert network failures into successful responses', async () => {
    const api = createApi({ fetchImpl: async () => { throw new Error('offline'); } });

    await expect(api.listTasks()).rejects.toThrow('offline');
  });
});
