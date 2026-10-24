'use strict';

const { initializeApp } = require('./app');

class FakeElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.value = '';
    this.children = [];
    this.listeners = new Map();
    this.attributes = {};
    this.className = '';
    this.open = false;
    this._textContent = '';
  }

  set textContent(value) {
    this._textContent = String(value);
    this.children = [];
  }

  get textContent() {
    return this._textContent || this.children.map((child) => child.textContent).join('');
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  async dispatch(type, event = {}) {
    const currentEvent = {
      preventDefault() {},
      target: this,
      currentTarget: this,
      ...event
    };
    await Promise.all((this.listeners.get(type) || []).map((listener) => listener(currentEvent)));
  }

  append(...elements) {
    this.children.push(...elements);
  }

  replaceChildren(...elements) {
    this.children = elements;
    this._textContent = '';
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  showModal() {
    this.open = true;
  }

  close() {
    this.open = false;
  }

  reset() {
    this.children = [];
  }
}

const elementIds = [
  'task-form',
  'title',
  'description',
  'category',
  'due-date',
  'filter-status',
  'filter-from',
  'filter-to',
  'filter-name',
  'task-list',
  'list-status',
  'error-dialog',
  'error-message',
  'error-close'
];

function createDocument() {
  const elements = Object.fromEntries(elementIds.map((id) => [id, new FakeElement()]));
  elements['task-form'].reset = jest.fn(() => {
    elements.title.value = '';
    elements.description.value = '';
    elements.category.value = '';
    elements['due-date'].value = '';
  });
  return {
    elements,
    getElementById: (id) => elements[id],
    createElement: (tagName) => new FakeElement(tagName)
  };
}

function findAll(element, predicate) {
  return [
    ...(predicate(element) ? [element] : []),
    ...element.children.flatMap((child) => findAll(child, predicate))
  ];
}

describe('task application flows', () => {
  const today = '2026-10-24';

  test('blocks missing, current-day, and past due dates with a Spanish modal', async () => {
    const document = createDocument();
    const api = { createTask: jest.fn(), listTasks: jest.fn().mockResolvedValue([]) };
    const app = initializeApp({ document, api, todayProvider: () => today });
    await app.ready;

    document.elements.title.value = 'Task';
    document.elements.category.value = 'Work';
    document.elements['due-date'].value = today;
    await document.elements['task-form'].dispatch('submit');
    expect(api.createTask).not.toHaveBeenCalled();
    expect(document.elements['error-dialog'].open).toBe(true);
    expect(document.elements['error-message'].textContent).toMatch(/posterior a hoy/i);

    document.elements.title.value = 'Task';
    document.elements['due-date'].value = '2026-10-23';
    await document.elements['task-form'].dispatch('submit');
    expect(api.createTask).not.toHaveBeenCalled();

    document.elements['due-date'].value = '2026-10-25';
    document.elements.category.value = ' ';
    await document.elements['task-form'].dispatch('submit');
    expect(api.createTask).not.toHaveBeenCalled();
    expect(document.elements['error-message'].textContent).toMatch(/categoría/i);
  });

  test('creates a valid task with a description longer than 500 characters', async () => {
    const document = createDocument();
    const description = 'Detalle '.repeat(100);
    const createdTask = { id: 'created-task', status: 'backlog' };
    const api = {
      createTask: jest.fn().mockResolvedValue(createdTask),
      listTasks: jest.fn().mockResolvedValue([])
    };
    const app = initializeApp({ document, api, todayProvider: () => today });
    await app.ready;

    document.elements.title.value = 'Prepare demo';
    document.elements.description.value = description;
    document.elements.category.value = 'Work';
    document.elements['due-date'].value = '2026-10-25';
    await document.elements['task-form'].dispatch('submit');

    expect(api.createTask).toHaveBeenCalledWith({
      title: 'Prepare demo',
      description,
      category: 'Work',
      due_date: '2026-10-25'
    });
    expect(document.elements['task-form'].reset).toHaveBeenCalled();
    expect(document.elements['error-dialog'].open).toBe(false);
  });

  test('shows the backend validation message when task creation fails', async () => {
    const document = createDocument();
    const api = {
      createTask: jest.fn().mockRejectedValue(new Error('La fecha límite debe ser posterior a hoy.')),
      listTasks: jest.fn().mockResolvedValue([])
    };
    const app = initializeApp({ document, api, todayProvider: () => today });
    await app.ready;

    document.elements.title.value = 'Prepare demo';
    document.elements.description.value = '';
    document.elements.category.value = 'Work';
    document.elements['due-date'].value = '2026-10-25';
    await document.elements['task-form'].dispatch('submit');

    expect(document.elements['error-dialog'].open).toBe(true);
    expect(document.elements['error-message'].textContent).toMatch(/posterior a hoy/i);
  });

  test('loads and renders tasks by category and status, with a clear empty state', async () => {
    const document = createDocument();
    const api = {
      listTasks: jest.fn().mockResolvedValue([
        { id: 'later', title: 'Later', category: 'Work', status: 'backlog', due_date: '2026-10-27' },
        { id: 'soon', title: 'Soon', category: 'Work', status: 'backlog', due_date: '2026-10-25' }
      ])
    };
    const app = initializeApp({ document, api });
    await app.ready;

    expect(api.listTasks).toHaveBeenCalledWith({});
    expect(findAll(document.elements['task-list'], (element) => element.tagName === 'H3')
      .map((element) => element.textContent)).toEqual(['Work']);
    expect(findAll(document.elements['task-list'], (element) => element.tagName === 'H5')
      .map((element) => element.textContent)).toEqual(['Soon', 'Later']);

    api.listTasks.mockResolvedValueOnce([]);
    await app.refresh();
    expect(findAll(document.elements['task-list'], (element) => element.className === 'empty-state'))
      .toHaveLength(1);
    expect(document.elements['task-list'].textContent).toMatch(/no hay tareas/i);
  });

  test('sends the selected status filter with date and name filters', async () => {
    const document = createDocument();
    const api = { listTasks: jest.fn().mockResolvedValue([]) };
    const app = initializeApp({ document, api });
    await app.ready;

    document.elements['filter-status'].value = 'backlog';
    document.elements['filter-from'].value = '2026-10-25';
    document.elements['filter-to'].value = '2026-11-01';
    document.elements['filter-name'].value = 'demo';
    await document.elements['filter-name'].dispatch('input');

    expect(api.listTasks).toHaveBeenLastCalledWith({
      status: 'backlog',
      from: '2026-10-25',
      to: '2026-11-01',
      name: 'demo'
    });
  });

  test('updates selected status only after success and restores the prior state on failure', async () => {
    const originalTask = {
      id: 'task-1',
      title: 'Prepare demo',
      category: 'Work',
      status: 'backlog',
      due_date: '2026-10-25'
    };
    const completedTask = { ...originalTask, status: 'done', completed_at: today };
    const document = createDocument();
    const api = {
      listTasks: jest.fn()
        .mockResolvedValueOnce([originalTask])
        .mockResolvedValueOnce([completedTask]),
      updateTaskStatus: jest.fn().mockResolvedValue(completedTask)
    };
    const app = initializeApp({ document, api });
    await app.ready;

    const statusSelect = findAll(document.elements['task-list'], (element) => element.className === 'task-status')[0];
    statusSelect.value = 'done';
    await statusSelect.dispatch('change');
    expect(api.updateTaskStatus).toHaveBeenCalledWith('task-1', 'done');
    expect(statusSelect.value).toBe('done');

    api.updateTaskStatus.mockRejectedValueOnce(new Error('No se pudo guardar.'));
    const currentSelect = findAll(document.elements['task-list'], (element) => element.className === 'task-status')[0];
    currentSelect.value = 'in progress';
    await currentSelect.dispatch('change');
    expect(document.elements['error-message'].textContent).toBe('No se pudo guardar.');
    expect(findAll(document.elements['task-list'], (element) => element.className === 'task-status')[0].value)
      .toBe('done');
  });
});
