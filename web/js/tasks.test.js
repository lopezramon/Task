'use strict';

const { filterTasks, groupTasks, validateTaskInput } = require('./tasks');

describe('task presentation grouping', () => {
  test('groups categories and statuses in the required order, sorting each group by due date', () => {
    const tasks = [
      { id: '1', category: 'Trabajo', status: 'done', due_date: '2026-10-28' },
      { id: '2', category: 'Personal', status: 'in progress', due_date: '2026-10-26' },
      { id: '3', category: 'Trabajo', status: 'backlog', due_date: '2026-10-27' },
      { id: '4', category: 'Trabajo', status: 'backlog', due_date: '2026-10-25' },
      { id: '5', category: 'Personal', status: 'backlog', due_date: '2026-10-24' }
    ];

    expect(groupTasks(tasks)).toEqual([
      {
        category: 'Personal',
        statuses: [
          { status: 'backlog', tasks: [tasks[4]] },
          { status: 'in progress', tasks: [tasks[1]] }
        ]
      },
      {
        category: 'Trabajo',
        statuses: [
          { status: 'backlog', tasks: [tasks[3], tasks[2]] },
          { status: 'done', tasks: [tasks[0]] }
        ]
      }
    ]);
  });

  describe('task presentation filters', () => {
    const tasks = [
      { id: '1', title: 'Preparar Demo', due_date: '2026-10-25', status: 'backlog' },
      { id: '2', title: 'Demo final', due_date: '2026-10-26', status: 'in progress' },
      { id: '3', title: 'Informe', due_date: '2026-10-27', status: 'backlog' }
    ];

    test('combines status, inclusive due-date range, and case-insensitive title match', () => {
      expect(filterTasks(tasks, {
        status: 'backlog',
        from: '2026-10-25',
        to: '2026-10-27',
        name: 'DEMO'
      })).toEqual([tasks[0]]);
    });

    test('supports individual criteria and an empty result', () => {
      expect(filterTasks(tasks, { status: 'in progress' })).toEqual([tasks[1]]);
      expect(filterTasks(tasks, { from: '2026-10-26', to: '2026-10-27' }))
        .toEqual([tasks[1], tasks[2]]);
      expect(filterTasks(tasks, { name: 'missing' })).toEqual([]);
    });
  });

  test('does not mutate the input array or its order', () => {
    const tasks = [
      { id: 'later', category: 'A', status: 'backlog', due_date: '2026-10-27' },
      { id: 'earlier', category: 'A', status: 'backlog', due_date: '2026-10-25' }
    ];
    const original = tasks.slice();

    groupTasks(tasks);

    expect(tasks).toEqual(original);
    expect(tasks[0]).toBe(original[0]);
  });
});

describe('task form validation', () => {
  test.each([
    [{ title: '', category: 'Work', due_date: '2026-10-25' }, '2026-10-24', /título/i],
    [{ title: 'Task', category: ' ', due_date: '2026-10-25' }, '2026-10-24', /categoría/i],
    [{ title: 'Task', category: 'Work', due_date: '' }, '2026-10-24', /fecha/i],
    [{ title: 'Task', category: 'Work', due_date: '2026-02-30' }, '2026-10-24', /fecha/i],
    [{ title: 'Task', category: 'Work', due_date: '2026-10-24' }, '2026-10-24', /posterior/i],
    [{ title: 'Task', category: 'Work', due_date: '2026-10-23' }, '2026-10-24', /posterior/i]
  ])('rejects invalid user input %#', (input, today, expectedMessage) => {
    expect(validateTaskInput(input, today)).toMatch(expectedMessage);
  });

  test('accepts a valid task with an unrestricted description', () => {
    const input = {
      title: ' Task ',
      description: 'x'.repeat(700),
      category: ' Work ',
      due_date: '2026-10-25'
    };
    expect(validateTaskInput(input, '2026-10-24')).toBeNull();
    expect(input.description).toHaveLength(700);
  });
});
