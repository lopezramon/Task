'use strict';

const {
  createTask,
  listTasks,
  updateTaskStatus,
  ValidationError
} = require('./tasks');

describe('task domain', () => {
  const today = '2026-10-24';

  test('creates a task with generated fields and preserves long descriptions', () => {
    const description = 'x'.repeat(700);
    const task = createTask({
      title: '  Prepare demo  ',
      description,
      category: '  Work  ',
      due_date: '2026-10-25'
    }, {
      today,
      idFactory: () => 'task-1'
    });

    expect(task).toEqual({
      id: 'task-1',
      title: 'Prepare demo',
      description,
      category: 'Work',
      due_date: '2026-10-25',
      status: 'backlog',
      created_at: today,
      completed_at: null
    });
  });

  test.each([
    [{ title: '', category: 'Work', due_date: '2026-10-25' }, /título/i],
    [{ title: 'Task', category: ' ', due_date: '2026-10-25' }, /categoría/i],
    [{ title: 'Task', category: 'Work' }, /fecha/i],
    [{ title: 'Task', category: 'Work', due_date: '2026-02-30' }, /fecha/i],
    [{ title: 'Task', category: 'Work', due_date: today }, /posterior/i],
    [{ title: 'Task', category: 'Work', due_date: '2026-10-23' }, /posterior/i]
  ])('rejects invalid creation data %#', (input, message) => {
    expect(() => createTask(input, { today })).toThrow(message);
  });

  test('defaults omitted descriptions to an empty string', () => {
    expect(createTask({
      title: 'Task',
      category: 'Personal',
      due_date: '2026-10-25'
    }, { today, idFactory: () => 'task-2' }).description).toBe('');
  });

  test('completes and reopens tasks with controlled completion dates', () => {
    const initial = {
      id: 'task-1',
      status: 'backlog',
      completed_at: null
    };
    const completed = updateTaskStatus([initial], 'task-1', 'done', { today });
    expect(completed).toEqual({ ...initial, status: 'done', completed_at: today });
    expect(updateTaskStatus([completed], 'task-1', 'in progress', { today })).toEqual({
      ...initial,
      status: 'in progress'
    });
  });

  test('rejects invalid status and unknown task identifiers', () => {
    expect(() => updateTaskStatus([], 'missing', 'done', { today })).toThrow(/no se encontró/i);
    expect(() => updateTaskStatus([{ id: 'task-1' }], 'task-1', 'blocked', { today }))
      .toThrow(ValidationError);
  });

  test('sorts by due date and applies combined inclusive filters', () => {
    const tasks = [
      { id: 'later', title: 'Demo follow-up', category: 'Work', due_date: '2026-10-27', status: 'backlog' },
      { id: 'first', title: 'DEMO prep', category: 'Work', due_date: '2026-10-25', status: 'backlog' },
      { id: 'other-status', title: 'Demo done', category: 'Work', due_date: '2026-10-26', status: 'done' },
      { id: 'other-name', title: 'Write report', category: 'Work', due_date: '2026-10-25', status: 'backlog' }
    ];

    expect(listTasks(tasks, {
      status: 'backlog',
      from: '2026-10-25',
      to: '2026-10-27',
      name: 'demo'
    }).map(({ id }) => id)).toEqual(['first', 'later']);
    expect(listTasks(tasks, { from: '2026-10-26', to: '2026-10-26' }).map(({ id }) => id))
      .toEqual(['other-status']);
    expect(listTasks(tasks, { name: 'not found' })).toEqual([]);
  });

  test('rejects malformed filter values', () => {
    const tasks = [];
    expect(() => listTasks(tasks, { status: 'blocked' })).toThrow(ValidationError);
    expect(() => listTasks(tasks, { from: '2026-02-30' })).toThrow(ValidationError);
    expect(() => listTasks(tasks, { from: '2026-11-01', to: '2026-10-01' })).toThrow(ValidationError);
  });
});
