# GastroManager — Backend API

API REST para la gestión integral de restaurantes. Permite administrar usuarios, menús, inventario, pedidos en mesa, pedidos externos (domicilio y para llevar), reservaciones, eventos, reportes y más.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js |
| Base de datos relacional | PostgreSQL + Sequelize |
| Base de datos documental | MongoDB + Mongoose |
| Autenticación | JWT (Access + Refresh Token) |
| Almacenamiento de imágenes | Cloudinary |
| Correo electrónico | Nodemailer (SMTP) |
| Seguridad | Helmet, CORS, Rate Limiting |
| Contenedores | Docker + Docker Compose |

---

## Requisitos previos

- Node.js 18 o superior
- Docker y Docker Compose
- Cuenta en Cloudinary (para subida de imágenes)
- Servidor SMTP (Gmail, Mailtrap, etc.)

---

## Instalación

```bash
# 1. Clonar el repositorio
https://github.com/ecujcuj-2024028/Restaurant-Management-System.git
cd Restaurant-Management-System

# 2. Instalar dependencias
pnpm install

# 3. Copiar y configurar variables de entorno
cp .env.example .env

# 4. Levantar las bases de datos con Docker
docker compose up -d

# 5. Iniciar el servidor en modo desarrollo
pnpm run dev
```

---

## Variables de entorno

Crear un archivo `.env` en la raíz con las siguientes variables:

```env
# ==============================================================================
# CONFIGURACIÓN GENERAL DE LA APLICACIÓN
# ==============================================================================
# Entorno: development, production, test
NODE_ENV=development
PORT=3000

# ==============================================================================
# BASES DE DATOS
# ==============================================================================
# PostgreSQL
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=nombre_de_tu_db
DB_USER=postgres
DB_PASSWORD=tu_contraseña_segura
DB_SQL_LOGGING=true

# MongoDB
# Ejemplo: mongodb://localhost:27017/nombre_db o atlas uri
MONGO_URI=mongodb://127.0.0.1:27017/nombre_db
PORT_MONGO=27017

# ==============================================================================
# SERVICIO DE CORREO (SMTP)
# ==============================================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_ENABLE_SSL=true
SMTP_USERNAME=tu_correo@gmail.com
SMTP_PASSWORD=tu_contraseña_de_aplicacion
EMAIL_FROM=noreply@tuapp.com
EMAIL_FROM_NAME="Nombre de Tu App"

# ==============================================================================
# AUTENTICACIÓN Y SEGURIDAD (JWT)
# ==============================================================================
# Genera un secreto fuerte con: openssl rand -base64 32
JWT_SECRET=tu_secreto_super_seguro
JWT_ISSUER=tuapp.com
JWT_AUDIENCE=tuapp_client
JWT_EXPIRES_IN=24h

# ==============================================================================
# ALMACENAMIENTO EN LA NUBE (CLOUDINARY)
# ==============================================================================
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
CLOUDINARY_FOLDER=nombre_carpeta_proyecto

# Directorio local temporal para subidas
UPLOAD_PATH=./uploads

# ==============================================================================
# CONFIGURACIÓN DEL ADMINISTRADOR INICIAL (SEEDER)
# ==============================================================================
ROOT_ADMIN_EMAIL=admin@tuapp.com
ROOT_ADMIN_PASSWORD=admin_password_provisional
ROOT_ADMIN_USERNAME=superadmin

# Token estático para bypass de seguridad en desarrollo o scripts (Úsalo con precaución)
ROOT_ADMIN_TOKEN=un_token_muy_largo_y_seguro
```

---

## Estructura del proyecto

```
resta/
├── configs/
│   ├── app.js                  # Configuración del servidor y rutas
│   ├── configs.js              # Variables de entorno centralizadas
│   ├── db-postgres.js          # Conexión a PostgreSQL (Sequelize)
│   ├── db-mongo.js             # Conexión a MongoDB (Mongoose)
│   ├── cors-configuration.js
│   └── helmet-configuration.js
│
├── helpers/
│   ├── email-service.js        # Envío de correos (bienvenida, facturas, alertas)
│   ├── cloudinary-service.js   # Subida de imágenes
│   ├── user-db.js              # Consultas de usuario entre DBs
│   ├── generate-jwt.js
│   ├── role-constants.js       # ADMIN_SISTEMA | ADMIN_RESTAURANTE | CLIENTE
│   └── uuid-generator.js
│
├── middlewares/
│   ├── validate-JWT.js
│   ├── hasRole.js
│   ├── validation.js
│   ├── request-limit.js        # Rate limiting por ruta
│   ├── deductInventoryStock.js
│   ├── validate-ownership.js
│   └── restaurant-uploader.js
│
├── src/
│   ├── auth/                   # Registro, login, verificación, roles
│   ├── user/                   # Perfil de usuario
│   ├── restaurants/            # CRUD de restaurantes
│   ├── tables/                 # Mesas (disponibilidad, ubicación)
│   ├── category/               # Categorías de menú
│   ├── gastronomy-oferts/      # Ofertas gastronómicas
│   ├── product/                # Productos del menú
│   ├── menu/                   # Menús del restaurante
│   ├── inventory/              # Inventario de insumos
│   ├── orders/                 # Pedidos en mesa
│   ├── external-orders/        # Pedidos a domicilio y para llevar
│   ├── Reservations/           # Reservaciones de mesa
│   ├── Eventos/                # Eventos del restaurante
│   ├── analytics/              # Reseñas y calificaciones
│   ├── reports/                # Reportes administrativos
│   ├── search/                 # Búsqueda global
│   └── customer/               # Historial del cliente
│
├── utils/
│   └── password-utils.js
│
├── docker-compose.yml
└── index.js
```

---

## Módulos y endpoints

Base path: `/restaurantManagement/v1`

### Autenticación — `/auth`

| Método | Ruta | Descripción | Protegido |
|---|---|---|---|
| POST | `/auth/register` | Registrar usuario | No |
| POST | `/auth/login` | Iniciar sesión | No |
| POST | `/auth/verify-email` | Verificar correo con token | No |
| POST | `/auth/forgot-password` | Solicitar reset de contraseña | No |
| POST | `/auth/reset-password` | Cambiar contraseña con token | No |
| GET | `/auth/role-requests/:id/approve` | Aprobar solicitud de rol | No (token URL) |
| GET | `/auth/role-requests/:id/reject` | Rechazar solicitud de rol | No (token URL) |
| POST | `/auth/request-role-upgrade` | Solicitar cambio de rol | JWT |

### Restaurantes — `/restaurants`

| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| GET | `/restaurants` | Listar restaurantes | Público |
| POST | `/restaurants` | Crear restaurante | Admin |
| PUT | `/restaurants/:id` | Editar restaurante | Admin |
| DELETE | `/restaurants/:id` | Eliminar restaurante | Admin |

### Mesas — `/tables`

| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| GET | `/tables` | Listar mesas | JWT |
| POST | `/tables` | Crear mesa | Admin |
| PUT | `/tables/:id` | Editar mesa | Admin |
| PATCH | `/tables/:id/availability` | Cambiar disponibilidad | Admin |

### Productos — `/products`

| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| GET | `/products` | Listar productos | Público |
| POST | `/products` | Crear producto | Admin |
| PUT | `/products/:id` | Editar producto | Admin |
| DELETE | `/products/:id` | Eliminar producto | Admin |

### Inventario — `/inventory`

| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| GET | `/inventory` | Listar insumos | JWT |
| POST | `/inventory` | Agregar insumo | Admin |
| PUT | `/inventory/:id` | Editar insumo | Admin |
| DELETE | `/inventory/:id` | Eliminar insumo | Admin |

### Pedidos en mesa — `/orders`

| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| POST | `/orders` | Crear pedido en mesa | JWT |
| GET | `/orders/history` | Historial del cliente | JWT |
| PATCH | `/orders/:id/cancel` | Cancelar pedido | JWT |
| GET | `/orders` | Listar pedidos del restaurante | Admin |
| PATCH | `/orders/:id/status` | Avanzar estado | Admin |
| GET | `/orders/:id/invoice` | Generar factura | JWT |

Flujo de estados: `recibido → en_preparacion → listo → entregado`

### Pedidos externos — `/external-orders`

| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| POST | `/external-orders` | Crear pedido (domicilio o para llevar) | JWT |
| GET | `/external-orders/history` | Historial del cliente | JWT |
| GET | `/external-orders/:id` | Detalle de un pedido | JWT |
| PATCH | `/external-orders/:id/cancel` | Cancelar pedido | JWT |
| GET | `/external-orders/:id/invoice` | Generar factura | JWT |
| GET | `/external-orders` | Listar pedidos del restaurante | Admin |
| PATCH | `/external-orders/:id/status` | Avanzar estado | Admin |

Flujo domicilio: `recibido → confirmado → en_preparacion → listo → en_camino → entregado`

Flujo para llevar: `recibido → confirmado → en_preparacion → listo → entregado`

### Reservaciones — `/reservations`

| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| POST | `/reservations` | Crear reservación | JWT |
| GET | `/reservations` | Listar reservaciones | JWT |
| PATCH | `/reservations/:id/cancel` | Cancelar reservación | JWT |

### Reportes — `/reports`

| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| GET | `/reports/sales` | Reporte de ventas | Admin |
| GET | `/reports/inventory` | Reporte de inventario | Admin |
| GET | `/reports/customers` | Reporte de clientes | Admin |

### Otros módulos

| Prefijo | Descripción |
|---|---|
| `/menus` | Gestión de menús |
| `/events` | Eventos del restaurante |
| `/analytics` | Reseñas y calificaciones |
| `/search` | Búsqueda global de productos y restaurantes |
| `/categories` | Categorías de menú |
| `/customer` | Historial del cliente |
| `/users` | Gestión de perfil de usuario |

---

## Roles del sistema

| Rol | Descripción |
|---|---|
| `ADMIN_SISTEMA` | Acceso total. Gestiona todos los restaurantes y usuarios |
| `ADMIN_RESTAURANTE` | Gestiona su propio restaurante, menú, inventario y pedidos |
| `CLIENTE` | Puede hacer pedidos, reservaciones y consultar su historial |

Los roles se asignan mediante solicitud desde la app. El `ADMIN_SISTEMA` aprueba o rechaza directamente desde el correo recibido.

---

## Correos automáticos

El sistema envía correos en los siguientes eventos:

- Verificación de cuenta al registrarse
- Bienvenida al verificar el correo
- Restablecimiento de contraseña
- Confirmación de cambio de contraseña
- Solicitud y respuesta de cambio de rol
- Confirmación de reservación
- Alerta de stock bajo en inventario
- Factura al completar un pedido

---

## Seguridad

- Contraseñas hasheadas con bcrypt (12 salt rounds)
- Rate limiting por tipo de ruta (general, autenticación, correo)
- Protección de cabeceras HTTP con Helmet
- CORS restringido por origen
- Bloqueo de IPs y rutas configurables vía `.env`
- Máximo 5 intentos de login antes de bloqueo temporal (30 min)

---

## Health check

```
GET /restaurantManagement/v1/health
```

```json
{
  "status": "Healthy",
  "timestamp": "2026-04-05T18:00:00.000Z",
  "service": "Kinal Restaurant Admin Server",
  "databases": {
    "postgresql": "Connected",
    "mongodb": "Connected"
  }
}
```

---

## Docker

```bash
# Levantar bases de datos
docker compose up -d

# Ver logs
docker compose logs -f

# Detener
docker compose down
```

Los servicios expuestos son `postgres_db` en el puerto definido por `DB_PORT` y `mongo_db` en el puerto definido por `PORT_MONGO`. Los datos persisten en volúmenes Docker.
