# Constitución del Proyecto

1. **Stack Mínimo**: Uso de tecnologías estándar y sin dependencias superfluas, mantenibles por un desarrollador junior.
2. **Spec Absoluta**: Ningún código se implementará sin estar previamente descrito y aprobado en la especificación (`docs/spec.md`).
3. **Separación de Capas**: La lógica de gestión de tareas estará 100% aislada de los componentes visuales de la interfaz.
4. **Política de Tests**: Los flujos críticos (crear tarea y marcar como finalizada) contarán con pruebas automatizadas obligatorias.
5. **Persistencia Simple**: Se utilizará un sistema de almacenamiento transparente y fácil de inspeccionar (ej. SQLite o JSON).
6. **Idioma**: Código, variables y commits en inglés; mensajes de interfaz y documentación orientada a usuario en español.