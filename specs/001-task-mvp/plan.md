# Plan técnico — Task MVP (Spec 001)

Este documento define tres planes coordinados: frontend, backend e integración. El usuario aprobó el stack de Node.js con biblioteca estándar y las categorías abiertas como texto. El código, las variables y los identificadores se escribirán en inglés; la interfaz y la documentación orientada al usuario estarán en español.

## Restricciones y alcance

- Se prioriza la biblioteca estándar de Node.js y del navegador. Jest es la única excepción permitida para tests.
- Para respetar esa restricción, se propone una interfaz web nativa (HTML, CSS y JavaScript) y un servidor HTTP con `node:http`; no se usarán Next.js ni Express.
- Esta decisión prioriza la aprobación explícita del usuario frente a la descripción anterior del proyecto en `Task/AGENTS.md`.
- La persistencia será un archivo JSON local, fácil de inspeccionar y sin servicio externo.
- No se implementarán autenticación, eliminación ni edición de los campos de la tarea. La única modificación admitida será el estatus.
- La categoría será texto abierto, aprobado por el usuario como la opción de menor complejidad.

## Modelo de datos JSON

### Persistencia (`data/tasks.json`)

```json
{
  "version": 1,
  "tasks": [
    {
      "id": "c5a47904-2405-4c5b-a8ce-1c8176b83a23",
      "title": "Preparar demo",
      "description": "Revisar el flujo completo antes de la presentación.",
      "category": "Trabajo",
      "due_date": "2026-11-05",
      "status": "in progress",
      "created_at": "2026-10-24",
      "completed_at": null
    },
    {
      "id": "375113eb-b175-4c78-84f6-d795e0372ce4",
      "title": "Enviar informe",
      "description": "",
      "category": "Trabajo",
      "due_date": "2026-11-07",
      "status": "done",
      "created_at": "2026-10-20",
      "completed_at": "2026-10-23"
    }
  ]
}
```

- `id` será un UUID generado con `node:crypto`; las fechas serán fechas calendario ISO `YYYY-MM-DD`.
- `title`, `category` y `due_date` son obligatorios. `description` admite texto de más de 500 caracteres; cuando se omita se guardará como cadena vacía.
- `status` solo admite `backlog`, `in progress` y `done`. Las tareas nuevas comienzan en `backlog`.
- `completed_at` será `null` mientras la tarea no esté completada y tendrá la fecha local de finalización al pasar a `done`. Al revertirla a un estado pendiente volverá a `null`.
- El archivo tendrá versión explícita para identificar el formato. No se contempla migración automática en este MVP.

## Plan de frontend

### Estructura de módulos

- `web/index.html` — estructura de la aplicación, formulario de creación, filtros y región de resultados (RF-01, RF-02, RF-04).
- `web/styles.css` — presentación responsive, estados de carga, lista vacía y estilo del modal (RF-01, RF-02, RF-04; RNF-01).
- `web/js/api.js` — funciones de acceso al API y normalización de errores HTTP; sin lógica visual ni persistencia (RF-01, RF-02, RF-03, RF-04).
- `web/js/tasks.js` — lógica de presentación pura: validación de interacción, agrupación y orden de listas, estado vacío y selección de estatus (RF-01, RF-02, RF-03, RF-04).
- `web/js/app.js` — conexión de eventos de la interfaz con `tasks.js` y `api.js`, apertura del modal de error y actualización de pantalla (RF-01, RF-02, RF-03, RF-04).

### Comportamiento y trazabilidad

- Formulario con título, descripción, categoría y fecha límite. El cliente dará feedback temprano, pero el servidor será la autoridad de validación (RF-01).
- Presentar las tareas agrupadas por categoría y, dentro de cada categoría, por estatus en el orden `backlog`, `in progress`, `done`. Cada grupo se ordenará por fecha límite ascendente (RF-02).
- Permitir seleccionar directamente uno de los estatus válidos. Tras guardar, actualizar la tarea y su fecha de finalización desde la respuesta del servidor (RF-03).
- Ofrecer filtros de estatus, fecha desde/hasta y coincidencia por título; mostrar un estado vacío claro cuando no existan coincidencias (RF-04).
- Mostrar un modal en español si hay campos obligatorios omitidos, una fecha límite inválida/no futura o una acción que el servidor rechaza (RF-01, RF-03).
- Mantener las funciones de lógica de tareas separadas del DOM para respetar la separación de capas de la Constitución (Constitución 3; RF-01 a RF-04).

## Plan de backend

### Estructura de módulos

- `server/index.js` — arranque del servidor HTTP nativo, lectura de configuración mínima y ruta al archivo de datos.
- `server/http.js` — enrutamiento HTTP, lectura acotada de cuerpos JSON, códigos de estado y serialización de respuestas.
- `server/tasks.js` — lógica de dominio independiente de HTTP: validación, alta, cambios de estado, filtros y orden (RF-01, RF-02, RF-03, RF-04).
- `server/storage.js` — lectura y escritura del formato JSON con `node:fs/promises`; nunca reemplazará el archivo si su lectura o parseo fallan (RF-01, RF-02, RF-03).

Las funciones públicas tendrán anotaciones JSDoc para tipos. Los mensajes destinados al usuario serán en español; nombres de módulos, variables y funciones serán en inglés.

### Responsabilidades y trazabilidad

- Validar los datos obligatorios, aceptar descripciones extensas y rechazar una fecha límite igual o anterior al día actual; al crear, asignar UUID, fecha de creación, `backlog` y `completed_at: null` (RF-01).
- Leer todas las tareas y aplicar filtros por estatus, rango inclusivo de fecha límite y coincidencia sin distinción de mayúsculas/minúsculas en el título. Entregar el conjunto ordenado ascendentemente por fecha límite (RF-02, RF-04).
- Validar que el estatus solicitado pertenezca al enum. Al entrar en `done`, registrar la fecha actual; al pasar de `done` a `backlog` o `in progress`, limpiar `completed_at` (RF-03).
- Devolver errores explícitos y respuestas JSON; no ocultar errores de almacenamiento tras respuestas de éxito (RF-01, RF-03; Constitución 5).
- Mantener la lógica de dominio libre del servidor HTTP y de la presentación (Constitución 3).

### Persistencia

`storage.js` leerá y escribirá `data/tasks.json`. La escritura reemplazará el archivo mediante un temporal en el mismo directorio y renombrado, evitando dejar un JSON parcialmente escrito. Un JSON corrupto o un error de disco se notificará como error del servidor y no se inicializará silenciosamente una colección vacía. Si el archivo aún no existe, el almacenamiento podrá inicializarse con `{ "version": 1, "tasks": [] }`.

## Plan de integración frontend–backend

### Contrato HTTP

Todas las respuestas tendrán `Content-Type: application/json; charset=utf-8`. El API será servido bajo `/api`; el mismo servidor podrá servir los recursos estáticos del frontend para evitar CORS y dependencias de proxy.

| Operación de interfaz | Endpoint | Entrada JSON / query | Respuesta | RF |
|---|---|---|---|---|
| Crear tarea | `POST /api/tasks` | JSON con `title`, `description`, `category`, `due_date` | `201` y la tarea completa creada | RF-01 |
| Cargar y filtrar tareas | `GET /api/tasks` | Query opcional: `status`, `from`, `to`, `name` | `200` con `{ "tasks": [...] }` | RF-02, RF-04 |
| Cambiar estatus | `PATCH /api/tasks/:id` | JSON con `status` | `200` y la tarea completa actualizada | RF-03 |

### Ejemplos de intercambio

Solicitud de creación:

```json
{
  "title": "Preparar demo",
  "description": "Revisar el flujo completo antes de la presentación.",
  "category": "Trabajo",
  "due_date": "2026-11-05"
}
```

Respuesta `201`:

```json
{
  "task": {
    "id": "c5a47904-2405-4c5b-a8ce-1c8176b83a23",
    "title": "Preparar demo",
    "description": "Revisar el flujo completo antes de la presentación.",
    "category": "Trabajo",
    "due_date": "2026-11-05",
    "status": "backlog",
    "created_at": "2026-10-24",
    "completed_at": null
  }
}
```

Solicitud para marcar como finalizada: `PATCH /api/tasks/c5a47904-2405-4c5b-a8ce-1c8176b83a23`

```json
{ "status": "done" }
```

Respuesta `200`: `{ "task": { "...": "...", "status": "done", "completed_at": "2026-10-24" } }`.

Ejemplo de consulta: `GET /api/tasks?status=backlog&from=2026-10-24&to=2026-11-30&name=demo`. `from` y `to` filtran `due_date` con extremos inclusivos; `name` busca una coincidencia parcial en `title`, sin distinguir mayúsculas. Los parámetros pueden combinarse.

### Errores del contrato

Formato común:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "La fecha límite debe ser posterior a hoy."
  }
}
```

- `400` para JSON mal formado, campos obligatorios inválidos, estatus no admitido o filtros mal formados; el frontend mostrará `message` en un modal (RF-01, RF-03, RF-04).
- `404` para una tarea inexistente al cambiar su estatus (RF-03).
- `500` para errores de almacenamiento/servidor, con un mensaje no sensible y explícito para la interfaz (RF-01, RF-02, RF-03, RF-04).
- No se devolverán cuerpos de éxito para errores; la interfaz conservará el estado anterior hasta recibir una respuesta exitosa.

### Decisiones técnicas justificadas

| Decisión | Justificación | Alternativa descartada |
|---|---|---|
| Node.js `node:http`, `node:fs/promises` y `node:crypto`; HTML/CSS/JavaScript nativos | Respeta la preferencia aclarada por biblioteca estándar, reduce dependencias y mantiene el sistema inspeccionable (Constitución 1 y 5). | Next.js y Express: prescritos en la descripción de `Task/AGENTS.md`, pero requieren paquetes externos y contradicen la aclaración de priorizar solo biblioteca estándar. |
| Un servidor sirve `/api` y los archivos estáticos | Evita CORS, proxy adicional y complejidad operativa para el MVP. | Servidores independientes con configuración CORS: añade configuración sin aportar valor funcional requerido. |
| Persistencia JSON versionada en disco | Transparente, fácil de inspeccionar y suficiente para el alcance de un único usuario sin autenticación (Constitución 5). | SQLite: opción válida en la Constitución, pero innecesaria para este modelo pequeño y añade otra representación/operación de datos. |
| Dominio separado de HTTP, almacenamiento y UI | Evita mezclar la lógica de tareas con componentes visuales y permite probarla aisladamente (Constitución 3). | Implementar reglas directamente en los manejadores HTTP o en los eventos DOM: acopla capas y dificulta pruebas. |
| Validación definitiva en backend y feedback temprano en frontend | El backend protege las reglas aunque el API se invoque sin la interfaz; la validación en cliente mejora la respuesta al usuario. | Confiar solo en validación del navegador: no garantiza integridad ni cumplimiento de RF al usar el API directamente. |
| Jest solo como dependencia de desarrollo de tests | Está expresamente permitido por `Task/AGENTS.md` y permite automatizar flujos críticos requeridos por la Constitución. | Añadir frameworks de test de navegador/servidor: supondría dependencias adicionales fuera de la excepción autorizada. |
| Proponer categorías de texto abierto, pendiente de aprobación | Permite crear y agrupar categorías sin catálogo adicional ni flujo de administración, pero no resuelve por sí solo la duda abierta de la spec. | Catálogo cerrado predefinido: exige definir opciones y mecanismos de mantenimiento aún no especificados. No se implementará ninguna opción hasta aprobarla en la spec. |

## Estrategia de tests

La suite se ejecutará con Jest (`npx jest --silent`, según `Task/AGENTS.md`). Las pruebas no usarán red externa ni escribirán sobre datos reales: emplearán fechas controlables, un servidor en puerto efímero y archivos JSON temporales.

### Frontend

- Unit tests de agrupación por categoría/estatus y orden por fecha, incluidos empates deterministas (RF-02).
- Unit tests de composición de filtros por estatus, fechas inclusivas y coincidencia parcial del título; resultado vacío legible (RF-04).
- Tests de interacción del flujo de creación: campos requeridos, fecha actual/pasada, descripción de más de 500 caracteres y modal ante error de validación API (RF-01).
- Tests de selección de estatus, actualización visual solo tras éxito y presentación de error al fallar la petición (RF-03).
- Pruebas de las funciones de presentación sin DOM siempre que sea posible; una prueba de integración pequeña verificará el cableado de eventos y contenido del modal sin añadir un framework de navegador (RF-01 a RF-04).

### Backend

- Tests unitarios de creación válida y rechazo de título/categoría ausentes y fecha límite no futura; incluir descripción mayor a 500 caracteres (RF-01).
- Tests unitarios de estados iniciales y valores de finalización al completar y revertir tareas, incluidos estatus inválidos (RF-03).
- Tests de filtros combinados, rango inclusivo, coincidencia parcial sin distinción de mayúsculas y orden ascendente (RF-02, RF-04).
- Tests de almacenamiento con archivo ausente, JSON válido, JSON corrupto y error de escritura; verificar que los errores no sobrescriban datos válidos ni aparenten éxito (RF-01 a RF-03).

### Integración API

- Tests HTTP end-to-end de `POST`, `GET` con/sin filtros y `PATCH`, verificando códigos, forma JSON y persistencia entre solicitudes (RF-01 a RF-04).
- Tests de errores `400`, `404` y `500`, y del contrato `{ "error": { "code", "message" } }` (RF-01, RF-03, RF-04).
- Test del flujo crítico completo: crear tarea → verla en la lista → marcarla `done` → comprobar `completed_at` → revertirla y comprobar que `completed_at` es `null` (RF-01, RF-02, RF-03).

## Matriz de cobertura RF

| Requisito | Frontend | Backend | Integración / tests |
|---|---|---|---|
| RF-01 — Crear tarea y validar datos | Formulario, feedback y modal de error | Validación, valores iniciales y persistencia | `POST`, errores de validación y creación persistida |
| RF-02 — Listar, agrupar y ordenar | Agrupación visual por categoría/estatus y estado vacío | Listado con orden por fecha límite | `GET` y verificación del orden y JSON |
| RF-03 — Cambiar y revertir estatus | Acción directa y actualización solo tras éxito | Validación de transición y fecha de finalización | `PATCH`, completar/revertir y verificar `completed_at` |
| RF-04 — Filtrar | Controles y filtros combinables | Filtros de estatus, fechas y título | `GET` con query combinada, límites y resultados vacíos |

## Decisiones aprobadas

El usuario aprobó el stack estándar descrito en este plan y el formato de categoría abierta. La especificación de tareas deberá implementar estas decisiones sin añadir dependencias de ejecución ni alterar el modelo JSON.
