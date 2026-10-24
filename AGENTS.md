# AGENTS.md — Task

## Proyecto
es un proyecto web para registrar actividades y marcalas como finalizadas, desarrollado en node express como backend y se propone una interfaz web nativa (HTML, CSS y JavaScript) para el frontend

## Comandos
- Ejecutar: npm install
- Tests: npm run test

## Estilo y convenciones
- ultims version de node estable, type hints en todas las funciones públicas.
- Solo biblioteca estándar (jes únicamente para tests).
- Identificadores en inglés; mensajes de usuario en español.

## Reglas
- Lee `docs/constitution.md` y la spec activa en `specs/` antes de tocar código.
- No añadas dependencias ni cambies el formato del JSON sin actualizar antes la spec.
- No modifiques archivos dentro de `specs/` salvo petición explícita.

## Al terminar cualquier tarea
- Ejecuta `npx jest --silent` y confirma en tu respuesta que todo pasa.