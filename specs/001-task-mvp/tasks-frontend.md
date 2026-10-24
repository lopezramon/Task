# Tareas de implementación — Frontend

Las tareas están ordenadas por dependencia y estimadas para completarse en 10–25 minutos cada una. No incluyen trabajo de backend; las llamadas de red usan el contrato definido en `plan.md`.

## Decisiones confirmadas

Stack de Node.js con biblioteca estándar y categorías abiertas como texto fueron aprobados por el usuario y reflejados en `plan.md`. Mantener los identificadores y el código en inglés, los mensajes de interfaz en español y la lógica de tareas separada del DOM.

## Tareas

- [x] **FE-01 — Preparar estructura del frontend** (15 min)  
  **RF:** RF-01, RF-02, RF-03, RF-04  
  **Hecho cuando:** existen `web/index.html`, `web/styles.css` y `web/js/` con los módulos `api.js`, `tasks.js` y `app.js`, enlazados sin errores de carga en el navegador.

- [x] **FE-02 — Crear el esqueleto semántico de la página** (20 min)  
  **RF:** RF-01, RF-02, RF-04  
  **Hecho cuando:** la página contiene formulario con título, descripción, categoría y fecha límite, controles de filtros, región de tareas y modal accesible con mensajes en español.

- [x] **FE-03 — Aplicar estilos base y estados visuales** (20 min)  
  **RF:** RF-01, RF-02, RF-04  
  **Hecho cuando:** formulario, filtros, resultados, modal y estado vacío son legibles en viewport estrecho y amplio, sin añadir dependencias.

- [x] **FE-04 — Implementar funciones puras de presentación** (20 min)  
  **RF:** RF-02  
  **Hecho cuando:** una función recibe tareas y devuelve grupos por categoría y por estatus en el orden `backlog`, `in progress`, `done`, ordenando cada grupo por `due_date` ascendente sin modificar la entrada.

- [x] **FE-05 — Añadir tests de agrupación y orden** (20 min)  
  **RF:** RF-02  
  **Hecho cuando:** Jest verifica múltiples categorías y estatus, orden ascendente y que la función no muta la lista original.

- [x] **FE-06 — Implementar funciones puras de filtrado** (20 min)  
  **RF:** RF-04  
  **Hecho cuando:** una función aplica conjuntamente estatus, fechas límite inclusivas y coincidencia parcial sin distinguir mayúsculas en el título, y admite cero resultados.

- [x] **FE-07 — Añadir tests de filtros y lista vacía** (20 min)  
  **RF:** RF-04  
  **Hecho cuando:** Jest verifica filtros individuales y combinados, extremos inclusivos, coincidencia sin distinguir mayúsculas y resultado vacío.

- [x] **FE-08 — Implementar el cliente HTTP JSON** (20 min)  
  **RF:** RF-01, RF-02, RF-03, RF-04  
  **Hecho cuando:** `api.js` expone funciones para `POST /api/tasks`, `GET /api/tasks` con query y `PATCH /api/tasks/:id`, y transforma respuestas de error `{ "error": { "code", "message" } }` en errores que la interfaz pueda mostrar.

- [x] **FE-09 — Validar el formulario y controlar el modal** (20 min)  
  **RF:** RF-01  
  **Hecho cuando:** el envío con título, categoría o fecha ausentes, o con fecha límite igual/anterior a hoy, no llama al API y muestra el modal; la descripción de más de 500 caracteres no se trunca ni se rechaza.

- [x] **FE-10 — Añadir tests del formulario y errores de creación** (20 min)  
  **RF:** RF-01  
  **Hecho cuando:** Jest comprueba campos requeridos, fecha actual y pasada, descripción extensa, envío válido y presentación en español de un error `400` del API.

- [x] **FE-11 — Conectar carga y renderizado de tareas** (20 min)  
  **RF:** RF-02  
  **Hecho cuando:** al iniciar, la interfaz solicita `GET /api/tasks`, representa las tareas agrupadas y ordenadas y muestra un estado vacío claro cuando la respuesta no contiene tareas.

- [x] **FE-12 — Conectar controles de filtrado** (20 min)  
  **RF:** RF-04  
  **Hecho cuando:** cambiar estatus, fecha desde/hasta o nombre envía los parámetros acordados al `GET /api/tasks` y representa también el estado sin coincidencias.

- [x] **FE-13 — Conectar selección directa de estatus** (20 min)  
  **RF:** RF-03  
  **Hecho cuando:** seleccionar un estatus permitido envía `PATCH /api/tasks/:id` con `{ "status": "..." }`, refresca desde la tarea devuelta solo si la respuesta es exitosa y abre el modal ante error.

- [x] **FE-14 — Añadir tests de los flujos de interfaz** (25 min)  
  **RF:** RF-01, RF-02, RF-03, RF-04  
  **Hecho cuando:** Jest verifica carga y estado vacío, aplicación de filtros, creación exitosa, cambio de estatus y que un error del API no presente una actualización como exitosa.
