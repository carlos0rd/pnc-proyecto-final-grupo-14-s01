# AutoCarService - Backend

API REST para gestión de vehículos, reparaciones y servicios en un taller mecánico. Incluye autenticación JWT, control de acceso por roles, subida de imágenes y lógica de recalculado de precios.

## Tecnologías utilizadas

- Node.js + Express
- MySQL
- JWT (autenticación)
- Multer (subida de imágenes)
- CORS, dotenv, bcrypt, nodemon

---

## Requisitos previos

- Node.js 14+  
- MySQL 8+  
- Crear archivo `.env` con los siguientes valores:

```env
PORT=3000
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=autocar_db
JWT_SECRET=secreto_super_seguro
```

## Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar script SQL si es necesario
mysql -u root -p < scripts/schema.sql

# Iniciar en modo desarrollo
npm run dev
```

---

## Estructura del proyecto

```
├── controller/
├── helpers/
├── middlewares/
├── models/
├── routes/
├── uploads/vehiculos/
├── index.js
└── .env
```

---

## Autenticación y roles

- Registro: `POST /auth/register`
- Login: `POST /auth/login`

### Roles

| Rol | ID | Permisos                      |
|-----|----|-------------------------------|
| Cliente | 1 | Ver sus vehículos           |
| Mecánico | 2 | CRUD de vehículos, reparaciones, servicios |
| Admin | 3 | Acceso completo               |

---

## Endpoints principales

### Vehículos

| Método | Endpoint             | Rol           |
|--------|----------------------|---------------|
| GET    | `/vehiculos`         | Cliente (solo los suyos) / Mecánico / Admin |
| GET    | `/vehiculos/:id`     | Autenticado   |
| POST   | `/vehiculos`         | Mecánico/Admin (**form-data**) |
| PUT    | `/vehiculos/:id`     | Mecánico/Admin |
| DELETE | `/vehiculos/:id`     | Mecánico/Admin |

- Carga de imágenes usando `multipart/form-data`.
- Se guarda en: `/uploads/vehiculos/`
- Se sirve en: `http://localhost:3000/imagenes/<nombre.png>`

### Reparaciones

| Método | Endpoint                              |
|--------|---------------------------------------|
| GET    | `/reparaciones/vehiculo/:vehiculo_id` |
| POST   | `/reparaciones`                       |
| PUT    | `/reparaciones/:id`                   |

- El precio se recalcula automáticamente según los servicios.

### Servicios

| Método | Endpoint                                |
|--------|------------------------------------------|
| GET    | `/api/servicios/reparacion/:id`          |
| POST   | `/api/servicios`                         |
| PUT    | `/api/servicios/:id`                     |
| DELETE | `/api/servicios/:id`                     |

---

## Paginación

- En `/vehiculos` se permite:
```
GET /vehiculos?page=2&limit=5
```

Respuesta:
```json
{
  "data": [ ... ],
  "currentPage": 2,
  "totalPages": 4,
  "totalItems": 19
}
```
---

## Subida y visualización de imágenes

- Se suben al directorio `/uploads/vehiculos`
- Se sirven en la ruta pública `/imagenes`:

```js
app.use("/imagenes", express.static(path.join(__dirname, "uploads", "vehiculos")));
```

- Ejemplo en frontend:

```jsx
<img src={`http://localhost:3000${vehiculo.imagen}`} />
```

---

## Re-cálculo de precio en reparaciones

Cada vez que se crea, edita o elimina un servicio, el precio de la reparación se recalcula automáticamente con:

```sql
UPDATE reparaciones
SET precio = (SELECT IFNULL(SUM(precio), 0) FROM servicios WHERE reparacion_id = ?)
WHERE id = ?
```
---

##  Base de Datos

El sistema utiliza una base de datos MySQL llamada `AutoCarService`, diseñada para gestionar usuarios, vehículos, reparaciones y servicios asociados. A continuación se describe la estructura principal de las tablas utilizadas:

### Estructura de Tablas

#### `roles`
Define los diferentes tipos de usuarios:
- `id` (INT, PK)
- `nombre` (VARCHAR) — Puede ser `'cliente'`, `'mecanico'` o `'admin'`

#### `usuarios`
Almacena los datos de los usuarios del sistema:
- `id` (INT, PK)
- `nombre_completo`, `email`, `contrasena`, `telefono`, `celular`
- `rol_id` (FK a `roles.id`)

#### `vehiculos`
Representa los vehículos de los clientes:
- `id` (INT, PK)
- `modelo`, `marca`, `anio`, `color`, `placa` (única), `imagen` (ruta relativa al backend)
- `usuario_id` (FK a `usuarios.id`)

#### `reparaciones`
Contiene la información sobre las reparaciones realizadas:
- `id` (INT, PK)
- `tipo_reparacion`, `descripcion`
- `fecha_inicio`, `fecha_fin`
- `status` (ENUM: `'Pendiente'`, `'En curso'`, `'Finalizado'`, `'Rechazado por el cliente'`)
- `precio` (se calcula automáticamente como la suma de los servicios)
- `vehiculo_id` (FK a `vehiculos.id`)
- `mecanico_id` (FK a `usuarios.id`)

#### `servicios`
Almacena los servicios individuales realizados durante una reparación:
- `id` (INT, PK)
- `nombre_servicio`, `descripcion`, `fecha_inicio`, `fecha_fin`, `precio`
- `reparacion_id` (FK a `reparaciones.id`)

### Relaciones

- Un usuario puede tener varios vehículos.
- Cada vehículo puede tener múltiples reparaciones.
- Cada reparación puede tener varios servicios asociados.
- Las reparaciones pueden ser asignadas a un mecánico (usuario con rol correspondiente).

### Script de Creación

El script completo de la base de datos se encuentra en el archivo `AutoCarService.sql`, y puede ser ejecutado directamente en MySQL Workbench o CLI para inicializar el esquema.

---

## Imágenes de Vehículos

Las imágenes se almacenan en la carpeta `/imagenes/` del backend y se acceden mediante rutas públicas habilitadas en el servidor Express.

---

## Organización del Proyecto

```
AutoCarService-Backend/
│
├── controller/            # Controladores (lógica de negocio)
├── middlewares/           # Middlewares (auth, validación)
├── models/                # Conexión DB y configuraciones
├── routes/                # Definición de rutas API
├── imagenes/              # Carpeta pública para imágenes
├── .env                   # Variables de entorno
├── server.js              # Entrada principal del servidor
└── package.json           # Dependencias y scripts
```

# Credenciales
`Amdministrador:`  
email: admin@gmail.com   
password: Admin13  

`Mecánico:`  
email: mecanico@gmail.com  
password: Mecanico123  

`Cliente:`  
email: cliente@gmail.com  
password: Cliente22  

[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/ffem3vg3)
