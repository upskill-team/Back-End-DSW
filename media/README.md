# API Documentation

## Table of Contents

- [English](#english)
- [Español](#español)

---

## English

This directory contains the Swagger/OpenAPI documentation for the UpSkill API.

### Available Endpoints

#### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/refresh` - Refresh access token using refresh token
- `POST /api/auth/logout` - Logout and invalidate tokens
- `POST /api/auth/forgot-password` - Request password reset email
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/profile` - Get authenticated user profile

#### Users

- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile
- `PUT /api/users/profile/picture` - Upload profile picture

#### Courses

- `GET /api/courses` - Get all published courses
- `GET /api/courses/trending` - Get trending courses
- `GET /api/courses/my-courses` - Get user's enrolled courses (Student) or created courses (Professor)
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create new course (Professor only)
- `PUT /api/courses/:id` - Update course (Professor only)
- `POST /api/courses/:id/units` - Add unit to course
- `PUT /api/courses/:id/units/:unitId` - Update course unit
- `POST /api/courses/:id/units/:unitId/activities` - Add activity to unit
- `POST /api/courses/:id/units/:unitId/materials` - Add material to unit

#### Enrollments

- `GET /api/enrollments` - Get all enrollments
- `GET /api/enrollments/:id` - Get enrollment details
- `POST /api/enrollments` - Enroll in a course
- `PUT /api/enrollments/:id` - Update enrollment progress

#### Professors

- `GET /api/professors` - Get all professors
- `GET /api/professors/:id` - Get professor details
- `GET /api/professors/profile` - Get own professor profile
- `PUT /api/professors/profile` - Update professor profile

#### Students

- `GET /api/students/:id` - Get student details
- `GET /api/students/profile` - Get own student profile
- `PUT /api/students/profile` - Update student profile

#### Institutions

- `GET /api/institutions` - Get all institutions
- `GET /api/institutions/:id` - Get institution details
- `POST /api/institutions` - Create institution (Admin only)
- `PUT /api/institutions/:id` - Update institution (Manager or Admin)

#### Course Types

- `GET /api/coursetypes` - Get all course types
- `GET /api/coursetypes/:id` - Get course type details
- `POST /api/coursetypes` - Create course type (Admin only)
- `PUT /api/coursetypes/:id` - Update course type (Admin only)

#### Appeals

- `GET /api/appeals/me` - Get current user's appeals
- `GET /api/appeals` - Get all appeals (Admin only)
- `GET /api/appeals/:id` - Get appeal details
- `POST /api/appeals` - Submit appeal to become professor
- `PUT /api/appeals/:id` - Update appeal status (Admin only)

#### Assessments

- `GET /api/assessments` - Get assessments
- `GET /api/assessments/:id` - Get assessment details
- `POST /api/assessments` - Create assessment (Professor only)
- `PUT /api/assessments/:id` - Update assessment (Professor only)
- `GET /api/assessments/:id/attempts` - Get student's attempts
- `POST /api/assessments/:id/attempts` - Start new attempt

#### Admin

- `GET /api/admin/analytics` - Get platform analytics (Admin only)
- `GET /api/admin/users` - Get all users (Admin only)

#### Other

- `POST /api/contact` - Send contact message
- `GET /api/join-requests` - Get join requests for institution
- `PUT /api/join-requests/:id` - Update join request status

### Viewing the Documentation

Start the server and navigate to:

```
http://localhost:3000/api-docs
```

---

<a name="español"></a>

## Español

Este directorio contiene la documentacion Swagger/OpenAPI para la API de UpSkill.

### Endpoints Disponibles

#### Autenticacion

- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesion con email y contraseña
- `POST /api/auth/refresh` - Renovar token de acceso usando refresh token
- `POST /api/auth/logout` - Cerrar sesion e invalidar tokens
- `POST /api/auth/forgot-password` - Solicitar email de recuperacion de contraseña
- `POST /api/auth/reset-password` - Restablecer contraseña con token
- `GET /api/auth/profile` - Obtener perfil del usuario autenticado

#### Usuarios

- `GET /api/users/profile` - Obtener perfil del usuario actual
- `PUT /api/users/profile` - Actualizar perfil del usuario actual
- `PUT /api/users/profile/picture` - Subir foto de perfil

#### Cursos

- `GET /api/courses` - Obtener todos los cursos publicados
- `GET /api/courses/trending` - Obtener cursos populares
- `GET /api/courses/my-courses` - Obtener cursos inscritos (Estudiante) o creados (Profesor)
- `GET /api/courses/:id` - Obtener detalles del curso
- `POST /api/courses` - Crear nuevo curso (solo Profesor)
- `PUT /api/courses/:id` - Actualizar curso (solo Profesor)
- `POST /api/courses/:id/units` - Agregar unidad al curso
- `PUT /api/courses/:id/units/:unitId` - Actualizar unidad del curso
- `POST /api/courses/:id/units/:unitId/activities` - Agregar actividad a la unidad
- `POST /api/courses/:id/units/:unitId/materials` - Agregar material a la unidad

#### Inscripciones

- `GET /api/enrollments` - Obtener todas las inscripciones
- `GET /api/enrollments/:id` - Obtener detalles de inscripcion
- `POST /api/enrollments` - Inscribirse en un curso
- `PUT /api/enrollments/:id` - Actualizar progreso de inscripcion

#### Profesores

- `GET /api/professors` - Obtener todos los profesores
- `GET /api/professors/:id` - Obtener detalles del profesor
- `GET /api/professors/profile` - Obtener perfil propio de profesor
- `PUT /api/professors/profile` - Actualizar perfil de profesor

#### Estudiantes

- `GET /api/students/:id` - Obtener detalles del estudiante
- `GET /api/students/profile` - Obtener perfil propio de estudiante
- `PUT /api/students/profile` - Actualizar perfil de estudiante

#### Instituciones

- `GET /api/institutions` - Obtener todas las instituciones
- `GET /api/institutions/:id` - Obtener detalles de institucion
- `POST /api/institutions` - Crear institucion (solo Admin)
- `PUT /api/institutions/:id` - Actualizar institucion (Gerente o Admin)

#### Tipos de Curso

- `GET /api/coursetypes` - Obtener todos los tipos de curso
- `GET /api/coursetypes/:id` - Obtener detalles del tipo de curso
- `POST /api/coursetypes` - Crear tipo de curso (solo Admin)
- `PUT /api/coursetypes/:id` - Actualizar tipo de curso (solo Admin)

#### Solicitudes

- `GET /api/appeals/me` - Obtener solicitudes del usuario actual
- `GET /api/appeals` - Obtener todas las solicitudes (solo Admin)
- `GET /api/appeals/:id` - Obtener detalles de solicitud
- `POST /api/appeals` - Enviar solicitud para ser profesor
- `PUT /api/appeals/:id` - Actualizar estado de solicitud (solo Admin)

#### Evaluaciones

- `GET /api/assessments` - Obtener evaluaciones
- `GET /api/assessments/:id` - Obtener detalles de evaluacion
- `POST /api/assessments` - Crear evaluacion (solo Profesor)
- `PUT /api/assessments/:id` - Actualizar evaluacion (solo Profesor)
- `GET /api/assessments/:id/attempts` - Obtener intentos del estudiante
- `POST /api/assessments/:id/attempts` - Iniciar nuevo intento

#### Administracion

- `GET /api/admin/analytics` - Obtener estadisticas de la plataforma (solo Admin)
- `GET /api/admin/users` - Obtener todos los usuarios (solo Admin)

#### Otros

- `POST /api/contact` - Enviar mensaje de contacto
- `GET /api/join-requests` - Obtener solicitudes de union a institucion
- `PUT /api/join-requests/:id` - Actualizar estado de solicitud de union

### Ver la Documentacion

Inicia el servidor y navega a:

```
http://localhost:3000/api-docs
```
