[⬅️ Volver al README Principal](../README.md) | [Ir a la Guía de Migraciones ➡️](./MIGRATIONS.md)

# Guía Detallada: Configuración del Entorno de Pagos para Pruebas

Esta guía es un paso a paso exhaustivo para configurar el entorno de desarrollo local y poder testear el flujo completo de pagos con Mercado Pago. Es crucial seguir cada instrucción con precisión.

---

## ⚠️ **Concepto Clave: ¿Por qué necesitamos todo esto?**

Nuestros servidores de desarrollo (frontend y backend) corren en `localhost`, una dirección privada que solo existe en nuestra computadora. Mercado Pago, al ser un servicio externo en internet, no puede "ver" nuestro `localhost`.

Para solucionar esto, usamos **servicios de túneles** (`Ngrok` y `Localtunnel`). Estas herramientas crean una URL pública en internet que redirige el tráfico de forma segura a nuestros puertos locales, actuando como un puente entre Mercado Pago y nuestra máquina.

---

## 🔑 **Paso 1: Credenciales de Mercado Pago (Individuales)**

Cada miembro del equipo **debe** realizar este paso para obtener sus propias credenciales de prueba. No se deben compartir.

### 1.1. Obtener el `Access Token` para el Backend

1.  **Crea una cuenta y ve al panel de desarrolladores:** Ve a [Mercado Pago Developers](https://www.mercadopago.com/developers) e inicia sesión.
2.  **Busca tus credenciales:** En el menú de la izquierda, haz clic en **Credenciales**.
3.  **Selecciona el entorno de prueba:** Asegúrate de que la pestaña **Credenciales de prueba** esté activa.
4.  **Copia tu Access Token:** Busca el campo llamado **Access Token**. Esta es tu clave secreta para comunicarte con la API de Mercado Pago. Cópiala y guárdala para usarla en el `.env` del backend.

### 1.2. Obtener el Usuario de Prueba para el Frontend

1.  **Busca tus cuentas de prueba:** En el mismo panel de desarrolladores, ve a **Cuentas de Prueba**.
2.  **Identifica al comprador:** Verás dos usuarios: un vendedor (Vendedor) y un comprador (Comprador). Necesitas los datos del **Comprador**.
3.  **Copia sus credenciales:** Copia el **email y la contraseña** de este usuario. Los usarás para iniciar sesión en la ventana de Mercado Pago durante la simulación de la compra.

---

## 🚇 **Paso 2: Instalación y Configuración de los Túneles**

Necesitaremos dos túneles distintos, uno para el frontend y otro para el backend.

### 2.1. Ngrok (Para el Frontend - Puerto 5173)

`Ngrok` es más estable, por lo que lo usaremos para el frontend, que es a donde el navegador será redirigido.

1.  **Crea una cuenta en Ngrok:** Ve a [ngrok.com](https://ngrok.com/) y regístrate para obtener una cuenta gratuita.
2.  **Instala Ngrok:** Sigue las instrucciones de instalación para tu sistema operativo. Generalmente implica descargar un archivo ZIP, descomprimirlo y mover el ejecutable a una ubicación accesible desde tu terminal.
3.  **Conecta tu cuenta:**
    - Una vez logueado en el dashboard de Ngrok, ve a la sección **"Your Authtoken"**.
    - Copia el comando que te proporcionan, que se verá así: `ngrok config add-authtoken <TU_TOKEN_PERSONAL>`.
    - Abre una terminal y **ejecuta ese comando**. Esto solo se hace una vez y vincula la herramienta de línea de comandos con tu cuenta.
4.  **Inicia el túnel para el frontend:** En una nueva terminal, ejecuta:
    ```bash
    ngrok http 5173
    ```
5.  **Copia la URL:** Ngrok te mostrará una URL en la línea `Forwarding` que termina en `.ngrok-free.dev`. **Copia esta URL completa (con `https://`)** y mantenla a mano.

### 2.2. Localtunnel (Para el Backend - Puerto 3000)

`Localtunnel` es más rápido de configurar y lo usaremos para el backend.

1.  **Requisito previo:** Asegúrate de tener Node.js y un gestor de paquetes como `npm` o `pnpm` instalados.
2.  **Configura el gestor de paquetes (si usas `pnpm`):** `pnpm` a veces necesita una configuración inicial para manejar paquetes globales. Abre una terminal y ejecuta:
    ```bash
    pnpm setup
    ```
    Después de ejecutarlo, **cierra y vuelve a abrir la terminal** para que los cambios surtan efecto. Si usas `npm`, puedes omitir este paso.
3.  **Instala Localtunnel globalmente:** En la terminal, ejecuta el siguiente comando. La bandera `-g` lo instala como una herramienta disponible en todo tu sistema.
    ```bash
    pnpm install -g localtunnel
    # O si usas npm:
    # npm install -g localtunnel
    ```
4.  **Inicia el túnel para el backend:** En una nueva terminal, ejecuta:
    ```bash
    lt --port 3000
    ```
5.  **Copia la URL:** `Localtunnel` te mostrará una URL como `your url is: https://<nombre-aleatorio>.loca.lt`. **Copia esta URL completa** y mantenla a mano.

---

## ⚙️ **Paso 3: Configuración de los Archivos de Entorno (`.env`)**

Ahora que tenemos las dos URLs públicas, vamos a configurar nuestros proyectos.

### 3.1. En el Backend:

1.  En la raíz del proyecto de backend, duplica `.env.example` y renómbralo a `.env`.
2.  Ábrelo y completa las siguientes variables:

    - `MP_ACCESS_TOKEN`: Pega aquí tu **Access Token** de Mercado Pago (Paso 1.1).
    - `NGROK_FRONTEND_URL`: Pega la URL completa que te dio **Ngrok** (Paso 2.1).
    - `LOCALTUNNEL_BACKEND_URL`: Pega la URL completa que te dio **Localtunnel** (Paso 2.2).
    - Asegúrate de que el resto de las variables (`DB_URL`, `JWT_SECRET`) sean correctas.

    ```env
    # Ejemplo .env del Backend
    NGROK_FRONTEND_URL=https://<url-de-ngrok>.ngrok-free.dev
    LOCALTUNNEL_BACKEND_URL=https://<url-de-localtunnel>.loca.lt
    MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxx...
    ```

### 3.2. En el Frontend:

1.  En la raíz del proyecto de frontend, crea o edita el archivo `.env`.
2.  Completa las siguientes variables:

    - `VITE_API_URL`: Debe apuntar a tu backend local (`http://localhost:3000/api`).
    - `VITE_ALLOWED_HOST`: Pega aquí **SOLO EL HOSTNAME** (sin `https://`) de la URL que te dio **Ngrok** (Paso 2.1).

    ```env
    # Ejemplo .env del Frontend
    VITE_API_URL=http://localhost:3000/api
    VITE_ALLOWED_HOST=<url-de-ngrok>.ngrok-free.dev
    ```

---

## 🚀 **Paso 4: Ejecutar y Probar**

1.  **Inicia tus servidores:**
    - En una terminal, inicia el servidor de **backend**.
    - En otra terminal, inicia el servidor de **frontend**.
2.  **Verifica que los túneles sigan activos** en sus respectivas terminales.
3.  **Inicia la prueba:** Abre tu navegador y ve a `http://localhost:5173`.
4.  Inicia sesión en tu plataforma, elige un curso de pago y haz clic en "Comprar".
5.  Usa los datos del **usuario de prueba de Mercado Pago** (Paso 1.2) para completar el pago.
6.  ¡Listo! El flujo de redirección, creación de inscripción y acceso al curso debería funcionar de principio a fin.

> **Recordatorio de Mantenimiento:** Los túneles gratuitos (especialmente `localtunnel`) pueden caerse. Si una prueba falla, tu primer reflejo debe ser revisar las terminales de los túneles. Si uno se cayó, reinícialo, copia la **nueva URL** y repite el **Paso 3** (actualizar los `.env` y reiniciar los servidores).
