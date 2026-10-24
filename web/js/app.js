'use strict';

(function exposeTaskApp(root) {
  const presentation = root.TaskPresentation
    || (typeof require === 'function' ? require('./tasks') : null);

  /**
   * Return the current local calendar date in YYYY-MM-DD format.
   * @returns {string}
   */
  function getToday() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Initialize event handlers and render task API responses into the page.
   * @param {{document: Document, api: object, todayProvider?: () => string}} options
   * @returns {{ready: Promise<void>, refresh: () => Promise<void>, getTasks: () => Array<object>}}
   */
  function initializeApp({ document, api, todayProvider = getToday }) {
    const elements = {
      form: document.getElementById('task-form'),
      title: document.getElementById('title'),
      description: document.getElementById('description'),
      category: document.getElementById('category'),
      dueDate: document.getElementById('due-date'),
      filterStatus: document.getElementById('filter-status'),
      filterFrom: document.getElementById('filter-from'),
      filterTo: document.getElementById('filter-to'),
      filterName: document.getElementById('filter-name'),
      taskList: document.getElementById('task-list'),
      listStatus: document.getElementById('list-status'),
      errorDialog: document.getElementById('error-dialog'),
      errorMessage: document.getElementById('error-message'),
      errorClose: document.getElementById('error-close')
    };
    for (const [name, element] of Object.entries(elements)) {
      if (!element) {
        throw new Error(`Falta un elemento requerido de la interfaz: ${name}.`);
      }
    }

    let tasks = [];

    function showError(error) {
      elements.errorMessage.textContent = error && error.message
        ? error.message
        : 'No se pudo completar la acción. Inténtalo de nuevo.';
      if (typeof elements.errorDialog.showModal === 'function') {
        if (!elements.errorDialog.open) {
          elements.errorDialog.showModal();
        }
      } else {
        elements.errorDialog.setAttribute('open', '');
      }
    }

    function getFilters() {
      const filters = {
        status: elements.filterStatus.value,
        from: elements.filterFrom.value,
        to: elements.filterTo.value,
        name: elements.filterName.value
      };
      return Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== '')
      );
    }

    function renderTaskList() {
      elements.taskList.replaceChildren();
      if (tasks.length === 0) {
        const emptyState = document.createElement('p');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'No hay tareas que coincidan con estos filtros.';
        elements.taskList.append(emptyState);
        return;
      }

      for (const categoryGroup of presentation.groupTasks(tasks)) {
        const categorySection = document.createElement('section');
        categorySection.className = 'category-group';
        const categoryHeading = document.createElement('h3');
        categoryHeading.textContent = categoryGroup.category;
        categorySection.append(categoryHeading);

        for (const statusGroup of categoryGroup.statuses) {
          const statusSection = document.createElement('section');
          statusSection.className = 'status-group';
          const statusHeading = document.createElement('h4');
          statusHeading.textContent = presentation.STATUS_LABELS[statusGroup.status];
          statusSection.append(statusHeading);

          for (const task of statusGroup.tasks) {
            const card = document.createElement('article');
            card.className = 'task-card';
            const title = document.createElement('h5');
            title.textContent = task.title;
            card.append(title);

            if (task.description) {
              const description = document.createElement('p');
              description.textContent = task.description;
              card.append(description);
            }

            const dueDate = document.createElement('p');
            dueDate.className = 'task-meta';
            dueDate.textContent = `Fecha límite: ${task.due_date}`;
            card.append(dueDate);

            const statusSelect = document.createElement('select');
            statusSelect.className = 'task-status';
            statusSelect.setAttribute('aria-label', `Estado de ${task.title}`);
            for (const status of presentation.STATUSES) {
              const option = document.createElement('option');
              option.value = status;
              option.textContent = presentation.STATUS_LABELS[status];
              statusSelect.append(option);
            }
            statusSelect.value = task.status;
            statusSelect.addEventListener('change', () => {
              changeStatus(task.id, statusSelect.value);
            });
            card.append(statusSelect);
            statusSection.append(card);
          }

          categorySection.append(statusSection);
        }
        elements.taskList.append(categorySection);
      }
    }

    async function refresh() {
      elements.listStatus.textContent = 'Cargando tareas…';
      try {
        tasks = await api.listTasks(getFilters());
        renderTaskList();
        elements.listStatus.textContent = '';
      } catch (error) {
        elements.listStatus.textContent = 'No se pudieron cargar las tareas.';
        showError(error);
      }
    }

    async function submitTask(event) {
      event.preventDefault();
      const input = {
        title: elements.title.value,
        description: elements.description.value,
        category: elements.category.value,
        due_date: elements.dueDate.value
      };
      const validationMessage = presentation.validateTaskInput(input, todayProvider());
      if (validationMessage) {
        showError(new Error(validationMessage));
        return;
      }

      try {
        const task = await api.createTask(input);
        tasks = [...tasks, task];
        elements.form.reset();
        renderTaskList();
        await refresh();
      } catch (error) {
        showError(error);
      }
    }

    async function changeStatus(id, status) {
      try {
        const updatedTask = await api.updateTaskStatus(id, status);
        tasks = tasks.map((task) => (task.id === id ? updatedTask : task));
        renderTaskList();
        await refresh();
      } catch (error) {
        renderTaskList();
        showError(error);
      }
    }

    elements.form.addEventListener('submit', submitTask);
    for (const filterElement of [
      elements.filterStatus,
      elements.filterFrom,
      elements.filterTo
    ]) {
      filterElement.addEventListener('change', refresh);
    }
    elements.filterName.addEventListener('input', refresh);
    elements.errorClose.addEventListener('click', () => elements.errorDialog.close());

    return {
      ready: refresh(),
      refresh,
      getTasks: () => tasks.slice()
    };
  }

  function startApp() {
    if (!root.document || !root.TaskApi || !root.TaskPresentation) {
      return;
    }
    initializeApp({
      document: root.document,
      api: root.TaskApi.createApi()
    });
  }

  const app = { initializeApp, startApp };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = app;
  }
  root.TaskApp = app;
  if (root.document) {
    startApp();
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
