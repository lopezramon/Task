# Acta de aceptación — Task MVP

- **Fecha de ejecución:** 2026-10-24 15:48 (UTC-04:00)
- **Spec evaluada:** [spec.md](./spec.md)
- **Plan evaluado:** [plan.md](./plan.md)
- **Comando ejecutado:** `cd Task && npx jest --runInBand --verbose`
- **Resultado global:** 8 suites aprobadas, 49 pruebas aprobadas, 0 fallidas.
- **Veredicto:** **No aceptada todavía; cumplimiento funcional de RF-01 a RF-04 demostrado salvo una brecha de prueba en RF-01.**

## Recorrido requisito por requisito

| Requisito | Tests que aportan evidencia | Resultado | Evaluación |
|---|---|---|---|
| **RF-01 — Crear tarea** | `server/tasks.test.js`: `creates a task with generated fields and preserves long descriptions`, `rejects invalid creation data %#`, `defaults omitted descriptions to an empty string`. `server/http.test.js`: `creates and persists tasks with the agreed JSON response`, `returns validation errors as JSON for invalid creation and request bodies`. `web/js/tasks.test.js`: `rejects invalid user input %#`, `accepts a valid task with an unrestricted description`. `web/js/app.test.js`: `blocks missing, current-day, and past due dates with a Spanish modal`, `creates a valid task with a description longer than 500 characters`, `shows the backend validation message when task creation fails`. | Las pruebas ejecutadas pasan. | **Parcialmente cubierto:** el título vacío se rechaza en dominio y la función de validación cliente, pero el test de interfaz no deja el título vacío ni verifica el modal en ese caso. La spec exige expresamente el modal al omitir el título. Falta evidencia automatizada para ese escenario. |
| **RF-02 — Listar, agrupar y ordenar** | `server/tasks.test.js`: `sorts by due date and applies combined inclusive filters`. `server/http.test.js`: `lists tasks ordered by due date and supports query filters`. `web/js/tasks.test.js`: `groups categories and statuses in the required order, sorting each group by due date`, `does not mutate the input array or its order`. `web/js/app.test.js`: `loads and renders tasks by category and status, with a clear empty state`. | Las pruebas ejecutadas pasan. | **Cubierto:** listado, agrupación visual categoría/estatus, orden por fecha límite y estado vacío. |
| **RF-03 — Cambiar y revertir estatus** | `server/tasks.test.js`: `completes and reopens tasks with controlled completion dates`, `rejects invalid status and unknown task identifiers`. `server/http.test.js`: `updates and reverts task status, including completion date`. `web/js/api.test.js`: `sends create, list, and status requests using the backend JSON contract`. `web/js/app.test.js`: `updates selected status only after success and restores the prior state on failure`. | Las pruebas ejecutadas pasan. | **Cubierto:** selección del estatus, registro de fecha `done`, reversión y restauración visual ante error. |
| **RF-04 — Filtrado** | `server/tasks.test.js`: `sorts by due date and applies combined inclusive filters`, `rejects malformed filter values`. `server/http.test.js`: `lists tasks ordered by due date and supports query filters`. `web/js/tasks.test.js`: `combines status, inclusive due-date range, and case-insensitive title match`, `supports individual criteria and an empty result`. `web/js/api.test.js`: `sends create, list, and status requests using the backend JSON contract`. `web/js/app.test.js`: `sends the selected status filter with date and name filters`. | Las pruebas ejecutadas pasan. | **Cubierto:** filtros combinables por estatus, rango inclusivo de fechas y coincidencia de nombre; se admite una lista sin resultados. |

## Criterios de finalización

1. **Spec aprobada y documentada:** **Cumplido.** El usuario aprobó las categorías abiertas como texto; la decisión quedó asentada en `spec.md` y se eliminó la duda abierta.
2. **Cobertura completa de historias y requisitos funcionales sin errores de validación:** **No demostrado completamente.** La suite no presenta pruebas fallidas, pero no verifica el modal al omitir el título, escenario requerido por RF-01. Las pruebas de validación unitaria del título no sustituyen la comprobación del comportamiento modal de interfaz.

## Conclusión

**La spec aún no puede declararse cumplida en su totalidad.** RF-02, RF-03 y RF-04 cuentan con pruebas aprobadas. RF-01 tiene pruebas aprobadas de validación, creación y modal para fechas/error API, pero queda pendiente probar explícitamente que enviar el formulario sin título no llama al API y muestra el modal. Este veredicto identifica una brecha de evidencia; no afirma que la implementación falle en ese escenario.

La salida detallada de Jest incluyó un `console.error` de `server/http.js` durante la prueba que simula un fallo de escritura (`disk failure`). La respuesta HTTP de error está verificada y la prueba pasa; el mensaje corresponde a la ruta de error ejercitada, no a un fallo de la suite.
