# Task MVP - euglis lopez

Aplicación web sencilla para registrar tareas personales, organizarlas por categorías y estado, y encontrarlas mediante filtros. La interfaz y los mensajes están en español. Las categorías son texto abierto.

## Funcionalidades

- Crear tareas con título, categoría y fecha límite futura; la descripción es opcional y admite más de 500 caracteres.
- Ver las tareas agrupadas por categoría y estado (`backlog`, `in progress`, `done`), ordenadas por fecha límite.
- Cambiar el estado de una tarea y revertir tareas finalizadas.
- Filtrar por estado, rango de fechas y coincidencia con el título.
- Persistir datos en el archivo JSON local `data/tasks.json`.

El proyecto usa Node.js y APIs nativas para el servidor HTTP y el frontend. Jest se utiliza para pruebas; no hay dependencias de ejecución externas.

## Requisitos

- Node.js compatible con Jest 29 (Node.js 18 o posterior).
- npm.

## Instalación y ejecución

Desde la raíz del repositorio:

```sh
cd Task
npm install
node server/index.js
```

Abre [http://127.0.0.1:3000](http://127.0.0.1:3000) en el navegador. La primera ejecución inicializa `data/tasks.json` con una lista vacía.

El servidor usa por defecto `127.0.0.1:3000`. Puedes cambiar la dirección o el puerto mediante variables de entorno:

```sh
HOST=127.0.0.1 PORT=4000 node server/index.js
```

Detén el servidor con `Ctrl+C`.

## Pruebas

Desde `Task/`:

```sh
npm test
```

Para ejecutar Jest directamente en modo silencioso:

```sh
npx jest --silent
```

Las pruebas cubren lógica de tareas, almacenamiento JSON, endpoints HTTP, recursos estáticos y flujos principales de la interfaz.

## Estructura

- `server/` — servidor HTTP, reglas de dominio y persistencia.
- `web/` — página, estilos, cliente API, lógica de presentación y controlador de interfaz.
- `specs/001-task-mvp/` — especificación, plan técnico y listas de tareas.
- `docs/constitution.md` — principios y restricciones del proyecto.

## API

- `POST /api/tasks` — crea una tarea.
- `GET /api/tasks` — lista tareas; admite `status`, `from`, `to` y `name`.
- `PATCH /api/tasks/:id` — actualiza el estado de una tarea enviando `{ "status": "done" }`.

El esquema de datos y los ejemplos JSON están descritos en [el plan técnico](./specs/001-task-mvp/plan.md).

## Fuera de alcance

Esta versión no incluye autenticación, eliminación de tareas ni edición de sus campos aparte del estado.
