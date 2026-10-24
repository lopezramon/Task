# Tareas de implementación — Backend

Las tareas están ordenadas por dependencia y estimadas para completarse en 10–25 minutos cada una. El contrato HTTP y el modelo JSON son los definidos en `plan.md`.

## Decisiones confirmadas

Stack `node:http` con biblioteca estándar y categoría abierta como texto fueron confirmados por el usuario. Mantener Jest solo para tests, anotaciones JSDoc en funciones públicas, mensajes destinados al usuario en español y errores explícitos.

## Tareas

- [x] **BE-01 — Preparar módulos y punto de arranque** (20 min)  
  **RF:** RF-01, RF-02, RF-03, RF-04  
  **Hecho cuando:** existen `server/index.js`, `server/http.js`, `server/tasks.js` y `server/storage.js`; las funciones públicas tienen JSDoc y el proceso arranca sin dependencias de ejecución externas.

- [x] **BE-02 — Implementar inicialización y lectura del JSON** (20 min)  
  **RF:** RF-01, RF-02, RF-03  
  **Hecho cuando:** `storage.js` crea el formato vacío versionado solo si el archivo no existe y devuelve tareas al leer un archivo válido.

- [x] **BE-03 — Probar lectura y errores de almacenamiento** (20 min)  
  **RF:** RF-01, RF-02, RF-03  
  **Hecho cuando:** Jest con directorio temporal verifica archivo ausente y válido, y confirma que JSON corrupto produce un error explícito sin reemplazar el archivo.

- [x] **BE-04 — Implementar escritura segura del archivo JSON** (20 min)  
  **RF:** RF-01, RF-03  
  **Hecho cuando:** la escritura serializa `{ "version": 1, "tasks": [...] }` mediante temporal y renombrado en el mismo directorio, y propaga errores de disco.

- [x] **BE-05 — Probar escritura y preservación de datos** (20 min)  
  **RF:** RF-01, RF-03  
  **Hecho cuando:** Jest verifica persistencia legible y que un fallo al escribir no se informa como éxito ni destruye el archivo válido anterior.

- [x] **BE-06 — Implementar validación de creación de tareas** (20 min)  
  **RF:** RF-01  
  **Hecho cuando:** la lógica de dominio rechaza título/categoría vacíos, fecha ausente, inválida, igual a hoy o pasada; acepta descripción mayor de 500 caracteres y prepara título, categoría y fecha para una tarea nueva.

- [x] **BE-07 — Completar creación con valores generados** (20 min)  
  **RF:** RF-01  
  **Hecho cuando:** una creación válida produce UUID, `created_at`, estado `backlog` y `completed_at: null`, y persiste la tarea sin truncar su descripción.

- [x] **BE-08 — Probar validación y creación** (20 min)  
  **RF:** RF-01  
  **Hecho cuando:** Jest cubre datos válidos, campos obligatorios ausentes, fecha actual/pasada y descripción extensa, verificando el estado inicial y los campos generados.

- [x] **BE-09 — Implementar cambio y reversión de estatus** (20 min)  
  **RF:** RF-03  
  **Hecho cuando:** la lógica acepta solo los tres estatus definidos, fija `completed_at` al entrar en `done` y lo limpia al volver a `backlog` o `in progress`.

- [x] **BE-10 — Probar ciclo de estatus** (20 min)  
  **RF:** RF-03  
  **Hecho cuando:** Jest verifica transiciones a `done` y desde `done`, fecha completada controlable y rechazo de un estatus no permitido.

- [x] **BE-11 — Implementar listado, orden y filtros** (25 min)  
  **RF:** RF-02, RF-04  
  **Hecho cuando:** la lógica devuelve tareas ordenadas por fecha límite ascendente y admite filtros combinables de estatus, fechas inclusivas y coincidencia parcial sin distinguir mayúsculas en el título.

- [x] **BE-12 — Probar listado y filtros** (20 min)  
  **RF:** RF-02, RF-04  
  **Hecho cuando:** Jest comprueba el orden, cada filtro por separado, filtros combinados, límites de fechas y lista vacía.

- [x] **BE-13 — Implementar utilidades HTTP JSON y errores** (20 min)  
  **RF:** RF-01, RF-03, RF-04  
  **Hecho cuando:** `http.js` puede leer cuerpos JSON, responder con `Content-Type: application/json; charset=utf-8` y serializar errores con forma `{ "error": { "code", "message" } }` y código HTTP explícito.

- [x] **BE-14 — Implementar endpoint de creación** (20 min)  
  **RF:** RF-01  
  **Hecho cuando:** `POST /api/tasks` valida y persiste la entrada, devuelve `201` con `{ "task": ... }` al éxito y `400` JSON ante entrada inválida.

- [x] **BE-15 — Implementar endpoint de listado y filtros** (20 min)  
  **RF:** RF-02, RF-04  
  **Hecho cuando:** `GET /api/tasks` devuelve `{ "tasks": [...] }`, interpreta `status`, `from`, `to` y `name`, y devuelve `400` JSON si los parámetros no son válidos.

- [x] **BE-16 — Implementar endpoint de cambio de estatus** (20 min)  
  **RF:** RF-03  
  **Hecho cuando:** `PATCH /api/tasks/:id` acepta `{ "status": "..." }`, devuelve la tarea actualizada, `400` para estatus inválido y `404` si el ID no existe.

- [x] **BE-17 — Conectar rutas HTTP con dominio y almacenamiento** (20 min)  
  **RF:** RF-01, RF-02, RF-03, RF-04  
  **Hecho cuando:** las tres rutas usan los módulos de dominio y almacenamiento, los errores de disco responden `500` JSON explícito y ninguna ruta devuelve éxito si falla la persistencia.

- [x] **BE-18 — Servir el frontend desde el mismo servidor** (20 min)  
  **RF:** RF-01, RF-02, RF-03, RF-04  
  **Hecho cuando:** el servidor entrega `web/index.html`, CSS y JavaScript junto con `/api`, sin añadir CORS ni dependencias externas.

- [x] **BE-19 — Añadir tests HTTP de endpoints y errores** (25 min)  
  **RF:** RF-01, RF-02, RF-03, RF-04  
  **Hecho cuando:** Jest con puerto efímero y almacenamiento temporal comprueba `POST`, `GET`, `PATCH`, formas JSON, códigos `201/200/400/404/500` y persistencia entre solicitudes.

- [x] **BE-20 — Verificar el flujo crítico integrado** (25 min)  
  **RF:** RF-01, RF-02, RF-03  
  **Hecho cuando:** un test HTTP crea una tarea, la recupera en el listado, la marca `done`, verifica `completed_at`, la revierte y confirma que `completed_at` vuelve a `null`.
