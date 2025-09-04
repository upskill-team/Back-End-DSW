# Guía de Documentación de la API (Swagger/OpenAPI)

Esta guía describe el proceso para documentar nuestra API utilizando el estándar OpenAPI con archivos YAML. Nuestro objetivo es mantener una documentación limpia, consistente y fácil de usar, que esté separada de la lógica de negocio de la aplicación.

## Filosofía

- **Separación de Responsabilidades:** Los archivos de rutas (`*.routes.ts`) solo deben contener la lógica de enrutamiento. La documentación de la API vive exclusivamente en archivos `.yaml` dentro de este directorio `src/docs/`.
- **YAML Primero:** Usamos YAML porque es más limpio y legible para definir datos estructurados como una especificación de API, en comparación con los comentarios JSDoc.
- **Única Fuente de Verdad:** El archivo `swagger.config.ts` es el punto de configuración central. Descubre y empaqueta automáticamente todos los archivos `.yaml` de este directorio.

---

## Cómo Documentar un Nuevo Módulo

Supongamos que queremos agregar un nuevo módulo de `Courses`. Aquí está el flujo de trabajo paso a paso:

### 1. Crea el Archivo YAML

Crea un nuevo archivo en este directorio nombrado como el módulo: `courses.docs.yaml`.

### 2. Define el Tag (Etiqueta)

El "tag" agrupa todos los endpoints relacionados en la interfaz de Swagger. Comienza tu archivo con esto:

```yaml
tags:
  - name: Courses
    description: Operations to manage courses and their content.
```

### 3. Define los Schemas (Esquemas)

Los esquemas definen la forma de tus datos-

```yaml
components:
  schemas:
    Course:
      type: object
      properties:
        id:
          type: string
          description: The unique ID of the course.
        name:
          type: string
          description: The public name of the course.

    CreateCourseInput:
      type: object
      required:
        - name
        - description
      properties:
        name:
          type: string
          description: The name for the new course.
          example: 'Advanced Starship Piloting'
        description:
          type: string
          description: A detailed description of the course.
          example: 'Learn to fly everything from an X-Wing to a Star Destroyer.'
```

### 4. Define los Paths (Endpoints)

Aquí es donde documentas cada endpoint individual (`GET`, `POST`, etc.).

```yaml
paths:
  /courses:
    get:
      summary: Get all courses
      tags: [Courses] # Esto lo vincula con el tag definido arriba
      description: Returns a list of all available courses.
      responses:
        '200':
          description: A list of courses was successfully retrieved.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Course' # Referencia al esquema
        '401':
          $ref: '#/components/responses/UnauthorizedError' # ¡Reutiliza respuestas comunes!

    post:
      summary: Create a new course (Professor Only)
      tags: [Courses]
      description: Creates a new course. Requires professor privileges.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateCourseInput' # Referencia al esquema de entrada
      responses:
        '201':
          description: Course created successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Course'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '403':
          $ref: '#/components/responses/ForbiddenError'
```

### 5. Reutiliza las Respuestas Comunes

Para mantener nuestra documentación DRY (Don't Repeat Yourself) y consistente, hemos definido respuestas de error comunes en `swagger.config.ts`. **Siempre** deberías usarlas a través de `$ref`:

- `$ref: '#/components/responses/UnauthorizedError'` (para 401)
- `$ref: '#/components/responses/ForbiddenError'` (para 403)
- `$ref: '#/components/responses/NotFoundError'` (para 404)

---

## Verificación Final

Después de añadir tu documentación, ejecuta la aplicación (`pnpm start:dev`) y navega a `http://localhost:3000/api-docs` para ver tus cambios reflejados en la interfaz de Swagger. Asegúrate de que todo se vea correcto antes de hacer commit.
