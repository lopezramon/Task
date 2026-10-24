'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const webDirectory = path.join(__dirname);

describe('frontend structure and document', () => {
  test('provides the planned entry point, styles, and JavaScript modules', async () => {
    for (const filePath of [
      'index.html',
      'styles.css',
      'js/api.js',
      'js/tasks.js',
      'js/app.js'
    ]) {
      await expect(fs.access(path.join(webDirectory, filePath))).resolves.toBeUndefined();
    }
  });

  test('declares the accessible task form, filters, results, and error dialog', async () => {
    const html = await fs.readFile(path.join(webDirectory, 'index.html'), 'utf8');

    for (const id of [
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
      'error-dialog',
      'error-message'
    ]) {
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).toMatch(/<html[^>]+lang="es"/i);
    expect(html).toMatch(/<form[^>]+novalidate/i);
    expect(html).toMatch(/id="title"[^>]+aria-required="true"/i);
    expect(html).toContain('js/tasks.js');
    expect(html).toContain('js/api.js');
    expect(html).toContain('js/app.js');
  });

  test('includes responsive styles and visible empty-state and dialog rules', async () => {
    const styles = await fs.readFile(path.join(webDirectory, 'styles.css'), 'utf8');

    expect(styles).toMatch(/@media/);
    expect(styles).toMatch(/dialog/);
    expect(styles).toMatch(/empty-state/);
  });
});
