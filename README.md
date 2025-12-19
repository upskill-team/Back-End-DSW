# UpSkill Backend API

## Table of Contents

- [English](#english)
- [Español](#español)
- [API Endpoints Documentation](./src/docs/README.md)

---

## English

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v10.9.0 or higher)
- MongoDB instance

### Environment Setup

1. Clone the repository:

```bash
git clone https://github.com/upskill-team/Back-End-DSW.git
cd Back-End-DSW
```

2. Install dependencies:

```bash
pnpm install
```

3. Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
NODE_ENV=development

# MongoDB
MONGO_USER=your_mongodb_user
MONGO_PASS=your_mongodb_password
MONGO_CLUSTER=your_mongodb_cluster
MONGO_DB_NAME=your_database_name

# JWT
JWT_SECRET=your_jwt_secret

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password

# Email (Resend - Optional)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=onboarding@resend.dev

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Mercado Pago
MP_ACCESS_TOKEN=your_mercadopago_access_token

# Frontend URL
NGROK_FRONTEND_URL=http://localhost:5173

# Backend URL (for webhooks)
LOCALTUNNEL_BACKEND_URL=http://localhost:3000

# Logtail (Optional)
LOG_SOURCE_TOKEN=your_logtail_token
LOG_SOURCE_URL=your_logtail_url
```

### Running the Server

**Development mode:**

```bash
pnpm start:dev
```

**Production build:**

```bash
pnpm build
pnpm start:prod
```

The server will start on `http://localhost:3000`

### Viewing Documentation

**Swagger API Documentation:**
Once the server is running, access the interactive API documentation at:

```
http://localhost:3000/api-docs
```

**TypeScript/TSDoc Documentation:**
Generate and view the code documentation:

```bash
pnpm run tdocs
```

Then open `docs/index.html` in your browser.

You can view the updated documentation at `https://upskill-team.github.io/Back-End-DSW/`

### Available Scripts

- `pnpm start:dev` - Start development server with hot reload
- `pnpm start:prod` - Start production server
- `pnpm build` - Compile TypeScript to JavaScript
- `pnpm lint` - Run ESLint
- `pnpm test` - Run all tests
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm tdocs` - Generate TypeScript documentation

---

<a name="español"></a>

## Español

### Requisitos Previos

- Node.js (v18 o superior)
- pnpm (v10.9.0 o superior)
- Instancia de MongoDB

### Configuracion del Entorno

1. Clonar el repositorio:

```bash
git clone https://github.com/upskill-team/Back-End-DSW.git
cd Back-End-DSW
```

2. Instalar dependencias:

```bash
pnpm install
```

3. Crear un archivo `.env` en el directorio raiz con las siguientes variables:

```env
PORT=3000
NODE_ENV=development

# MongoDB
MONGO_USER=tu_usuario_mongodb
MONGO_PASS=tu_contrasena_mongodb
MONGO_CLUSTER=tu_cluster_mongodb
MONGO_DB_NAME=nombre_de_tu_base_de_datos

# JWT
JWT_SECRET=tu_secreto_jwt

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_usuario_email
EMAIL_PASS=tu_contrasena_email

# Email (Resend - Opcional)
RESEND_API_KEY=tu_clave_api_resend
EMAIL_FROM=onboarding@resend.dev

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_nombre_cloudinary
CLOUDINARY_API_KEY=tu_clave_cloudinary
CLOUDINARY_API_SECRET=tu_secreto_cloudinary

# Mercado Pago
MP_ACCESS_TOKEN=tu_token_acceso_mercadopago

# URL Frontend
NGROK_FRONTEND_URL=http://localhost:5173

# URL Backend (para webhooks)
LOCALTUNNEL_BACKEND_URL=http://localhost:3000

# Logtail (Opcional)
LOG_SOURCE_TOKEN=tu_token_logtail
LOG_SOURCE_URL=tu_url_logtail
```

### Ejecutar el Servidor

**Modo desarrollo:**

```bash
pnpm start:dev
```

**Compilacion para produccion:**

```bash
pnpm build
pnpm start:prod
```

El servidor iniciara en `http://localhost:3000`

### Ver la Documentacion

**Documentacion de la API con Swagger:**
Una vez que el servidor este ejecutandose, accede a la documentacion interactiva de la API en:

```
http://localhost:3000/api-docs
```

**Documentacion de TypeScript/TSDoc:**
Generar y ver la documentacion del codigo:

```bash
pnpm run tdocs
```

Luego abre `docs/index.html` en tu navegador.

Puedes ver la documentación actualizada en `https://upskill-team.github.io/Back-End-DSW/`

### Scripts Disponibles

- `pnpm start:dev` - Iniciar servidor de desarrollo con recarga automatica
- `pnpm start:prod` - Iniciar servidor de produccion
- `pnpm build` - Compilar TypeScript a JavaScript
- `pnpm lint` - Ejecutar ESLint
- `pnpm test` - Ejecutar todas las pruebas
- `pnpm test:coverage` - Ejecutar pruebas con reporte de cobertura
- `pnpm tdocs` - Generar documentacion TypeScript

---

## Project Structure

```
Back-End-DSW/
├── src/
│   ├── app.ts              # Express app configuration
│   ├── server.ts           # Server entry point
│   ├── auth/               # Authentication module
│   ├── models/             # Business entities and logic
│   ├── shared/             # Shared utilities and services
│   ├── emails/             # Email templates and services
│   └── docs/               # API documentation (Swagger)
├── dist/                   # Compiled JavaScript output
├── docs/                   # Generated TSDoc documentation
└── coverage/               # Test coverage reports
```
