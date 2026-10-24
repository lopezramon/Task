# Especificación 001: Task MVP

## Contexto y Objetivo
El objetivo de este proyecto es proporcionar una herramienta web sencilla y mantenible por un desarrollador junior para registrar tareas, organizarlas por categorías y estatus, y gestionar su ciclo de vida básico (crear, cambiar estatus, listar y filtrar). El propósito es habilitar un flujo de trabajo claro de organización personal sin complejidad técnica excesiva.

## Usuarios
- **Desarrollador Junior / Usuario Final**: Persona que busca registrar sus tareas diarias, gestionarlas de forma visual y filtrar sus pendientes.

## Historias de Usuario
- Como usuario, quiero crear una tarea con título, descripción, categoría y fecha límite futura para organizar mis pendientes.
- Como usuario, quiero ver un listado de tareas organizado por categorías y estatus (`backlog`, `in progress`, `done`), ordenadas por fecha límite próxima, para saber qué hacer primero.
- Como usuario, quiero cambiar el estatus de una tarea (`backlog` a `in progress` o `done`) y guardar la fecha de finalización si se marca como hecha.
- Como usuario, quiero revertir el estatus de una tarea finalizada a pendiente si me equivoqué.
- Como usuario, quiero filtrar las tareas por estatus, fecha y nombre para encontrar información rápidamente.
- Como usuario, quiero recibir una notificación mediante un modal si intento realizar una acción no permitida o omito datos obligatorios.

## Requisitos Funcionales (RF-x) con Criterios de Aceptación (Notación EARS)
- **RF-01 (Creación de Tarea)**: El sistema permitirá crear una tarea que contenga título (obligatorio), descripción (opcional, soporte mayor a 500 caracteres), categoría abierta de texto libre (obligatoria) y fecha límite (obligatoria y en el futuro).
  - *Cuando* el usuario envíe el formulario de creación con datos válidos, *el sistema* registrará la tarea con estatus inicial `backlog`.
  - *Cuando* el usuario intente crear una tarea sin título o con fecha pasada, *el sistema* mostrará un modal indicando que la acción no está permitida.
- **RF-02 (Listado y Visualización)**: El sistema presentará las tareas agrupadas primero por categoría y luego por estatus (`backlog`, `in progress`, `done`), ordenadas de manera ascendente por la fecha límite más próxima.
- **RF-03 (Gestión de Estatus)**: El usuario podrá cambiar el estatus de una tarea mediante una acción directa (clic) para seleccionarlo.
  - *Si* una tarea pasa a estatus `done`, *el sistema* registrará automáticamente la fecha en que se completó.
  - *El sistema* permitirá revertir el estatus de una tarea completada de vuelta a un estado pendiente (ej. `backlog` o `in progress`).
- **RF-04 (Filtrado de Tareas)**: El sistema ofrecerá opciones para filtrar las tareas según su estatus, rango de fechas y coincidencia con el nombre.

## Requisitos No Funcionales
- **RNF-01**: Interfaz intuitiva y adaptada a la simplicidad requerida por un desarrollador junior.
- **RNF-02**: Respeto estricto a la Constitución del Proyecto (`docs/constitution.md`).

## Casos Límite
- Intentar registrar una fecha límite que coincida con el día actual o pasado (debe rechazarse mostrando el modal de error).
- Descripciones de texto extensas que superen los 500 caracteres (el sistema debe almacenarlas y soportarlas correctamente).
- Filtrar por criterios que no devuelvan ninguna tarea (el sistema mostrará un estado vacío claro).

## Fuera de Alcance
- Autenticación y gestión de usuarios.
- Edición completa de tareas existentes (más allá de cambiar su estatus).
- Eliminación de tareas.

## Criterios de Finalización
- La especificación está aprobada y documentada en `specs/001-task-mvp/spec.md`.
- Cobertura completa de los flujos descritos en las historias de usuario y requisitos funcionales sin errores de validación.

## Decisiones Aprobadas
- **Categorías**: Se utilizará texto abierto escrito libremente por el usuario, por ser la alternativa de menor complejidad. Esta decisión fue aprobada por el usuario el 2026-10-24.