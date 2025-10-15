[⬅️ Volver al README Principal](../README.md) | [Ir a la Guía de Pagos ➡️](./PAYMENT_SETUP.md)

## 📄 Gestión de Migraciones de Base de Datos

Este documento describe el flujo de trabajo para gestionar los cambios en el esquema de la base de datos utilizando el sistema de migraciones de MikroORM.

## Filosofía

Este proyecto utiliza un sistema de migraciones versionado para gestionar todos los cambios en el esquema de la base de datos. Este sistema reemplaza el método anterior e inseguro de usar `syncSchema()`, que no es adecuado para entornos de producción ya que puede provocar la pérdida de datos.

Las migraciones nos permiten:

- **Versionar los Cambios:** Cada cambio en el esquema (añadir una tabla, una columna, un índice, etc.) se representa en un archivo de migración, que se versiona en Git como cualquier otro código.
- **Prevenir la Pérdida de Datos:** Las migraciones se aplican de forma controlada, asegurando que los cambios se realicen de manera predecible.
- **Colaboración en Equipo:** Permite que múltiples desarrolladores trabajen en cambios de la base de datos de forma segura y sin conflictos.
- **Despliegues Confiables:** El estado de la base de datos en producción siempre está sincronizado con el código de la aplicación.

## El Nuevo Flujo de Trabajo

Cuando necesites realizar un cambio en la estructura de la base de datos (por ejemplo, añadir una nueva propiedad a una entidad), sigue estos pasos:

### Paso 1: Modificar una Entidad

Realiza los cambios necesarios en tu archivo de entidad. Por ejemplo, para añadir un campo `middleName` a la entidad `User`:

```typescript
// src/models/user/user.entity.ts
// ...
export class User {
  // ... (propiedades existentes)

  @Property({ nullable: true })
  middleName?: string; // <-- Nuevo campo
}
```

### Paso 2: Generar la Migración

Una vez que hayas guardado los cambios en tu entidad, ejecuta el siguiente comando desde la raíz del proyecto para que MikroORM compare el estado actual de tus entidades con el estado de la última migración y genere un nuevo archivo con las diferencias:

```bash
pnpm migration:create
```

**Mejor Práctica (Recomendado):** Para que tu historial de migraciones sea más legible, dale un nombre descriptivo a tu migración usando el flag `-n`:

```bash
pnpm migration:create -n AddMiddleNameToUser
```

Esto creará un nuevo archivo en la carpeta `src/migrations` con un nombre similar a `Migration20240523103000_AddMiddleNameToUser.ts`.

### Paso 3: Revisar el Archivo de Migración Generado

Abre el nuevo archivo de migración. Verás dos métodos principales:

- `up()`: Contiene el código que se ejecutará para **aplicar** tus cambios (ej. `ALTER TABLE`, `CREATE INDEX`).
- `down()`: Contiene el código para **revertir** esos cambios.

Es una buena práctica revisar rápidamente este archivo para asegurarte de que los cambios generados son los que esperabas.

### Paso 4: Aplicar la Migración

Tienes dos maneras de aplicar la migración en tu entorno de desarrollo:

1.  **Automáticamente (Recomendado):** Simplemente inicia o reinicia el servidor de desarrollo. La aplicación está configurada para ejecutar automáticamente todas las migraciones pendientes al arrancar.

    ```bash
    pnpm start:dev
    ```

    Verás un log en la consola indicando que la nueva migración se ha ejecutado.

2.  **Manualmente:** Si prefieres aplicar la migración sin reiniciar el servidor, puedes usar el comando `up`:
    ```bash
    pnpm migration:up
    ```

Ya está, ahora tu cambio de esquema se aplicó de forma segura y está versionado en el repositorio.

## Comandos Disponibles

Resumen de los scripts de migración disponibles en `package.json`:

| Comando                 | Descripción                                                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm migration:create` | Genera un nuevo archivo de migración con los cambios detectados en las entidades.                                                         |
| `pnpm migration:up`     | Aplica todas las migraciones pendientes que aún no se han ejecutado en la base de datos.                                                  |
| `pnpm migration:down`   | Revierte la última migración que fue aplicada. Útil para deshacer rápidamente un cambio durante el desarrollo.                            |
| `pnpm migration:fresh`  | **¡PELIGROSO!** Elimina toda la base de datos y vuelve a ejecutar todas las migraciones desde el principio. **Úsalo solo en desarrollo.** |

## Buenas Prácticas y Consideraciones

- **Las Migraciones son Inmutables:** Una vez que una migración ha sido fusionada a la rama principal (`main` o `develop`), **nunca debe ser editada**. Si necesitas corregir algo, crea una **nueva** migración que aplique la corrección.
- **Trabajo en Equipo:** Si haces `git pull` y un compañero ha añadido una nueva migración, simplemente ejecuta `pnpm migration:up` (o reinicia tu servidor) para poner tu base de datos local al día.
