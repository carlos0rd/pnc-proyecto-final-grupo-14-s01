# Documentación de API - AutoCarService

## Tabla de Contenidos

1. [Información General](#información-general)
2. [Autenticación](#autenticación)
3. [Roles de Usuario](#roles-de-usuario)
4. [Códigos de Estado HTTP](#códigos-de-estado-http)
5. [Endpoints](#endpoints)
   - [Autenticación](#endpoints-de-autenticación)
   - [Usuarios](#endpoints-de-usuarios)
   - [Vehículos](#endpoints-de-vehículos)
   - [Reparaciones](#endpoints-de-reparaciones)
   - [Servicios](#endpoints-de-servicios)
   - [Repuestos](#endpoints-de-repuestos)
   - [Facturas](#endpoints-de-facturas)

---

## Información General

**URL Base:** `http://localhost:3000`

**Formato de datos:** JSON

**Autenticación:** Bearer Token (JWT) en header `Authorization`

---

## Autenticación

La mayoría de los endpoints requieren autenticación mediante JWT. El token debe enviarse en el header de la petición:

```
Authorization: Bearer <token>
```

El token tiene una validez de 1 hora.

---

## Roles de Usuario

- **1 - Cliente:** Puede ver y gestionar sus propios datos
- **2 - Mecánico:** Puede gestionar reparaciones, servicios y repuestos
- **3 - Administrador:** Acceso completo al sistema

---

## Códigos de Estado HTTP

| Código | Significado | Descripción |
|--------|-------------|-------------|
| 200 | OK | Petición exitosa |
| 201 | Created | Recurso creado exitosamente |
| 400 | Bad Request | Error en los datos enviados |
| 401 | Unauthorized | Token no proporcionado o inválido |
| 403 | Forbidden | No tienes permiso para esta acción |
| 404 | Not Found | Recurso no encontrado |
| 500 | Internal Server Error | Error interno del servidor |

---

## Endpoints

### Endpoints de Autenticación

#### POST /auth/register

Registrar un nuevo usuario (cliente).

**Request Body:**
```json
{
  "nombre_completo": "Juan Pérez",
  "email": "juan@example.com",
  "contrasena": "password123",
  "telefono": "2234-5678",
  "celular": "1234-5678"
}
```

**Response 201 (Created):**
```json
{
  "message": "Usuario registrado exitosamente"
}
```

**Errores:**
- `400`: Campos obligatorios incompletos
- `500`: Error en el servidor o email duplicado

---

#### POST /auth/login

Iniciar sesión y obtener token JWT.

**Request Body:**
```json
{
  "email": "juan@example.com",
  "contrasena": "password123"
}
```

**Response 200 (OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errores:**
- `401`: Credenciales incorrectas
- `500`: Error en el servidor

---

### Endpoints de Usuarios

**Todas las rutas requieren autenticación.**

#### GET /usuarios/me

Obtener información del usuario autenticado.

**Response 200 (OK):**
```json
{
  "id": 1,
  "email": "juan@example.com",
  "rol_id": 1,
  "nombre_completo": "Juan Pérez",
  "telefono": "2234-5678",
  "celular": "1234-5678"
}
```

---

#### GET /usuarios

Obtener todos los usuarios. **Solo administradores.**

**Response 200 (OK):**
```json
[
  {
    "id": 1,
    "nombre_completo": "Juan Pérez",
    "email": "juan@example.com",
    "telefono": "2234-5678",
    "celular": "1234-5678",
    "rol_id": 1
  }
]
```

---

#### PUT /usuarios/:id

Editar información del usuario (nombre, email, teléfonos). El usuario solo puede editar sus propios datos, excepto administradores.

**Request Body:**
```json
{
  "nombre_completo": "Juan Carlos Pérez",
  "email": "juancarlos@example.com",
  "telefono": "2234-5679",
  "celular": "1234-5679"
}
```

**Response 200 (OK):**
```json
{
  "message": "Usuario actualizado correctamente"
}
```

**Errores:**
- `403`: No puedes editar otros usuarios
- `500`: Error en el servidor

---

#### PUT /usuarios/cambiar-contrasena/:id

Cambiar contraseña del usuario.

**Request Body:**
```json
{
  "nuevaContrasena": "newpassword123"
}
```

**Response 200 (OK):**
```json
{
  "message": "Contraseña actualizada correctamente"
}
```

**Errores:**
- `400`: La contraseña debe tener al menos 6 caracteres
- `403`: No tienes permiso para cambiar esta contraseña

---

#### PUT /usuarios/admin/:id

Editar usuario completo (incluye rol). **Solo administradores.**

**Request Body:**
```json
{
  "nombre_completo": "Juan Pérez",
  "email": "juan@example.com",
  "telefono": "2234-5678",
  "celular": "1234-5678",
  "rol_id": 2
}
```

---

#### PATCH /usuarios/:id/rol

Cambiar rol de usuario. **Solo administradores.**

**Request Body:**
```json
{
  "rol_id": 2
}
```

**Response 200 (OK):**
```json
{
  "message": "Rol actualizado correctamente"
}
```

---

#### DELETE /usuarios/:id

Eliminar usuario. **Solo administradores.**

**Response 200 (OK):**
```json
{
  "message": "Usuario eliminado correctamente"
}
```

---

### Endpoints de Vehículos

**Todas las rutas requieren autenticación.**

#### POST /vehiculos

Crear un nuevo vehículo. **Mecánicos y administradores.**

**Request (multipart/form-data):**
- `modelo`: string (obligatorio)
- `marca`: string (obligatorio)
- `anio`: number (obligatorio)
- `color`: string (obligatorio)
- `placa`: string (obligatorio, único)
- `clienteEmail`: string (obligatorio)
- `imagen`: file (opcional, máximo 2MB)

**Response 201 (Created):**
```json
{
  "message": "Vehículo registrado correctamente"
}
```

**Errores:**
- `400`: Campos obligatorios incompletos o archivo demasiado grande
- `404`: Cliente no encontrado
- `500`: Error al registrar vehículo

---

#### GET /vehiculos

Obtener lista de vehículos con paginación.

**Query Parameters:**
- `page`: número de página (default: 1)
- `limit`: elementos por página (default: 5)

**Ejemplo:** `/vehiculos?page=1&limit=10`

**Response 200 (OK):**
```json
{
  "data": [
    {
      "id": 1,
      "modelo": "Corolla",
      "marca": "Toyota",
      "anio": 2020,
      "color": "Blanco",
      "placa": "ABC-123",
      "imagen": "/imagenes/abc123.jpg",
      "usuario_id": 1,
      "cliente": "Juan Pérez",
      "mecanico": "Carlos Mecánico"
    }
  ],
  "currentPage": 1,
  "totalPages": 5,
  "totalItems": 25
}
```

**Nota:** Los clientes solo ven sus propios vehículos.

---

#### GET /vehiculos/:id

Obtener un vehículo por ID.

**Response 200 (OK):**
```json
{
  "id": 1,
  "modelo": "Corolla",
  "marca": "Toyota",
  "anio": 2020,
  "color": "Blanco",
  "placa": "ABC-123",
  "imagen": "/imagenes/abc123.jpg",
  "usuario_id": 1
}
```

**Errores:**
- `404`: Vehículo no encontrado
- `403`: No tienes acceso a este vehículo

---

#### PUT /vehiculos/:id

Editar un vehículo. **Mecánicos y administradores.**

**Request (multipart/form-data):**
- `modelo`: string (opcional)
- `marca`: string (opcional)
- `anio`: number (opcional)
- `color`: string (opcional)
- `placa`: string (opcional)
- `imagen`: file (opcional, máximo 2MB)

**Response 200 (OK):**
```json
{
  "message": "Vehículo actualizado correctamente"
}
```

---

#### DELETE /vehiculos/:id

Eliminar un vehículo. **Mecánicos y administradores.**

**Response 200 (OK):**
```json
{
  "message": "Vehículo eliminado correctamente"
}
```

---

### Endpoints de Reparaciones

**Todas las rutas requieren autenticación.**

#### POST /reparaciones

Crear una nueva reparación. **Mecánicos y administradores.**

**Request (multipart/form-data):**
- `tipo_reparacion`: string (obligatorio)
- `descripcion`: string (obligatorio)
- `fecha_inicio`: date (obligatorio, formato: YYYY-MM-DD)
- `fecha_fin`: date (opcional)
- `status`: string (opcional, valores: 'Pendiente', 'En curso', 'Finalizado', 'Rechazado por el cliente', 'Aprobada por el cliente')
- `vehiculo_id`: number (obligatorio)
- `imagen_antes`: file (opcional, máximo 2MB)

**Response 201 (Created):**
```json
{
  "message": "Reparación registrada correctamente"
}
```

**Errores:**
- `400`: Campos obligatorios incompletos o archivo demasiado grande
- `403`: No tienes permiso para crear reparaciones
- `500`: Error al registrar reparación

---

#### GET /reparaciones

Obtener lista de reparaciones.

**Response 200 (OK):**
```json
[
  {
    "id": 1,
    "tipo_reparacion": "Cambio de aceite",
    "descripcion": "Cambio de aceite y filtro",
    "fecha_inicio": "2024-01-15",
    "fecha_fin": "2024-01-15",
    "status": "Finalizado",
    "precio": 150.00,
    "vehiculo_id": 1,
    "mecanico_id": 2,
    "modelo": "Corolla",
    "placa": "ABC-123",
    "cliente": "Juan Pérez",
    "tiene_servicios": true
  }
]
```

**Nota:** Los clientes solo ven reparaciones de sus vehículos.

---

#### GET /reparaciones/mantenimientos-proximos

Obtener mantenimientos próximos.

---

#### GET /reparaciones/vehiculo/:identificador

Obtener reparaciones por vehículo (puede ser ID o placa).

**Response 200 (OK):**
```json
[
  {
    "id": 1,
    "tipo_reparacion": "Cambio de aceite",
    "descripcion": "Cambio de aceite y filtro",
    "fecha_inicio": "2024-01-15",
    "status": "Finalizado",
    "precio": 150.00
  }
]
```

---

#### GET /reparaciones/:id

Obtener una reparación por ID.

**Response 200 (OK):**
```json
{
  "id": 1,
  "tipo_reparacion": "Cambio de aceite",
  "descripcion": "Cambio de aceite y filtro",
  "fecha_inicio": "2024-01-15",
  "fecha_fin": "2024-01-15",
  "status": "Finalizado",
  "precio": 150.00,
  "vehiculo_id": 1,
  "mecanico_id": 2,
  "imagen_antes": "/imagenes/antes.jpg",
  "imagen_despues": "/imagenes/despues.jpg"
}
```

---

#### PUT /reparaciones/:id

Editar una reparación. **Mecánicos y administradores.**

**Request (multipart/form-data):**
- `tipo_reparacion`: string (opcional)
- `descripcion`: string (opcional)
- `fecha_inicio`: date (opcional)
- `fecha_fin`: date (opcional)
- `status`: string (opcional)
- `imagen_antes`: file (opcional, máximo 2MB)
- `imagen_despues`: file (opcional, máximo 2MB)

**Response 200 (OK):**
```json
{
  "message": "Reparación actualizada correctamente"
}
```

---

#### PATCH /reparaciones/:id/decision-cotizacion

Aprobar o rechazar cotización. **Clientes.**

**Request Body:**
```json
{
  "decision": "aprobada"  // o "rechazada"
}
```

**Response 200 (OK):**
```json
{
  "message": "Decisión registrada correctamente"
}
```

---

#### DELETE /reparaciones/:id

Eliminar una reparación. **Mecánicos y administradores.**

**Response 200 (OK):**
```json
{
  "message": "Reparación eliminada correctamente"
}
```

---

### Endpoints de Servicios

**Todas las rutas requieren autenticación.**

#### POST /api/servicios

Crear un nuevo servicio. **Mecánicos y administradores.**

**Request Body:**
```json
{
  "nombre_servicio": "Cambio de filtro de aire",
  "descripcion": "Instalación de nuevo filtro de aire",
  "fecha_inicio": "2024-01-15",
  "fecha_fin": "2024-01-15",
  "costo_mano_obra": 50.00,
  "reparacion_id": 1,
  "repuestos": [
    {
      "repuesto_id": 1,
      "cantidad": 2
    },
    {
      "repuesto_id": 3,
      "cantidad": 1
    }
  ]
}
```

**Response 201 (Created):**
```json
{
  "message": "Servicio agregado correctamente",
  "servicio_id": 5,
  "precio_total": 87.50
}
```

**Errores:**
- `400`: Campos obligatorios incompletos
- `403`: No tienes permiso para crear servicios
- `500`: Error al crear servicio

---

#### GET /api/servicios/reparacion/:reparacion_id

Obtener servicios de una reparación.

**Response 200 (OK):**
```json
[
  {
    "id": 1,
    "nombre_servicio": "Cambio de filtro de aire",
    "descripcion": "Instalación de nuevo filtro de aire",
    "fecha_inicio": "2024-01-15",
    "fecha_fin": "2024-01-15",
    "precio": 87.50,
    "reparacion_id": 1
  }
]
```

---

#### GET /api/servicios/:id/completo

Obtener servicio completo con repuestos. **Mecánicos y administradores.**

**Response 200 (OK):**
```json
{
  "id": 1,
  "nombre_servicio": "Cambio de filtro de aire",
  "descripcion": "Instalación de nuevo filtro de aire",
  "fecha_inicio": "2024-01-15",
  "fecha_fin": "2024-01-15",
  "precio": 87.50,
  "reparacion_id": 1,
  "total_repuestos": 37.50,
  "mano_obra": 50.00,
  "repuestos": [
    {
      "repuesto_id": 1,
      "cantidad": 2,
      "nombre": "Filtro de aceite Toyota",
      "precio_unitario": 12.50,
      "descripcion": "Filtro de aceite estándar",
      "categoria_id": 1
    }
  ]
}
```

---

#### PUT /api/servicios/:id

Editar un servicio. **Mecánicos y administradores.**

**Request Body:**
```json
{
  "nombre_servicio": "Cambio de filtro de aire actualizado",
  "descripcion": "Instalación de filtro de aire premium",
  "fecha_inicio": "2024-01-15",
  "fecha_fin": "2024-01-15",
  "costo_mano_obra": 60.00,
  "repuestos": [
    {
      "repuesto_id": 1,
      "cantidad": 1
    }
  ]
}
```

**Response 200 (OK):**
```json
{
  "message": "Servicio actualizado correctamente",
  "precio_total": 72.50
}
```

---

#### DELETE /api/servicios/:id

Eliminar un servicio. **Mecánicos y administradores.**

**Response 200 (OK):**
```json
{
  "message": "Servicio eliminado correctamente"
}
```

---

### Endpoints de Repuestos

**Todas las rutas requieren autenticación.**

#### GET /repuestos

Obtener lista de repuestos.

**Query Parameters:**
- `categoria_id`: filtrar por categoría (opcional)
- `activo`: filtrar por estado activo/inactivo (solo admin, opcional, valores: 'true'/'false')

**Ejemplo:** `/repuestos?categoria_id=1&activo=true`

**Response 200 (OK):**
```json
[
  {
    "id": 1,
    "nombre": "Filtro de aceite Toyota",
    "precio_unitario": 12.50,
    "descripcion": "Filtro de aceite estándar para motores Toyota 1.8-2.5L",
    "activo": 1,
    "categoria_id": 1,
    "categoria_nombre": "Filtros"
  }
]
```

**Nota:** Clientes y mecánicos solo ven repuestos activos. Administradores pueden ver todos.

---

#### GET /repuestos/:id

Obtener un repuesto por ID.

**Response 200 (OK):**
```json
{
  "id": 1,
  "nombre": "Filtro de aceite Toyota",
  "precio_unitario": 12.50,
  "descripcion": "Filtro de aceite estándar para motores Toyota 1.8-2.5L",
  "activo": 1,
  "categoria_id": 1,
  "categoria_nombre": "Filtros"
}
```

---

#### POST /repuestos

Crear un nuevo repuesto. **Mecánicos y administradores.**

**Request Body:**
```json
{
  "nombre": "Filtro de aceite Premium",
  "precio_unitario": 15.00,
  "categoria_id": 1,
  "descripcion": "Filtro de aceite de alta calidad",
  "activo": 1
}
```

**Response 201 (Created):**
```json
{
  "message": "Repuesto creado correctamente",
  "id": 25
}
```

**Errores:**
- `400`: Campos obligatorios incompletos o categoría no existe
- `403`: No tienes permiso para crear repuestos
- `500`: Error al crear repuesto

---

#### PUT /repuestos/:id

Editar un repuesto. **Mecánicos y administradores.**

**Request Body:**
```json
{
  "nombre": "Filtro de aceite Premium Actualizado",
  "precio_unitario": 16.00,
  "categoria_id": 1,
  "descripcion": "Filtro de aceite de alta calidad mejorado",
  "activo": 1
}
```

**Response 200 (OK):**
```json
{
  "message": "Repuesto actualizado correctamente"
}
```

**Nota:** Todos los campos son opcionales, solo se actualizan los enviados.

---

#### DELETE /repuestos/:id

Eliminar un repuesto (soft delete). **Solo administradores.**

**Response 200 (OK):**
```json
{
  "message": "Repuesto eliminado correctamente"
}
```

---

### Endpoints de Categorías de Repuestos

#### GET /repuestos/categorias/todas

Obtener todas las categorías con cantidad de repuestos.

**Response 200 (OK):**
```json
[
  {
    "id": 1,
    "nombre": "Filtros",
    "cantidad_repuestos": 5
  },
  {
    "id": 2,
    "nombre": "Frenos",
    "cantidad_repuestos": 3
  }
]
```

---

#### GET /repuestos/categorias/:categoria_id

Obtener repuestos por categoría.

**Response 200 (OK):**
```json
{
  "categoria": {
    "id": 1,
    "nombre": "Filtros"
  },
  "repuestos": [
    {
      "id": 1,
      "nombre": "Filtro de aceite Toyota",
      "precio_unitario": 12.50,
      "descripcion": "Filtro de aceite estándar",
      "activo": 1,
      "categoria_id": 1,
      "categoria_nombre": "Filtros"
    }
  ]
}
```

---

#### POST /repuestos/categorias

Crear una nueva categoría. **Solo administradores.**

**Request Body:**
```json
{
  "nombre": "Neumáticos"
}
```

**Response 201 (Created):**
```json
{
  "message": "Categoría creada correctamente",
  "id": 11
}
```

**Errores:**
- `400`: El nombre es obligatorio o ya existe una categoría con ese nombre
- `403`: Solo los administradores pueden crear categorías

---

#### PUT /repuestos/categorias/:id

Editar una categoría. **Solo administradores.**

**Request Body:**
```json
{
  "nombre": "Filtros y Lubricantes"
}
```

**Response 200 (OK):**
```json
{
  "message": "Categoría actualizada correctamente"
}
```

**Errores:**
- `400`: El nombre es obligatorio o ya existe una categoría con ese nombre
- `404`: Categoría no encontrada

---

### Endpoints de Facturas

**Todas las rutas requieren autenticación.**

#### GET /facturas

Obtener lista de facturas.

**Response 200 (OK):**
```json
[
  {
    "id": 1,
    "numero_factura": "FAC-2024-0001",
    "fecha": "2024-01-20",
    "vehiculo": "Toyota Corolla - ABC-123",
    "total": 150.00,
    "status": "Pendiente",
    "reparacion_id": 1
  }
]
```

**Nota:** Los clientes solo ven sus propias facturas. Administradores y mecánicos ven todas.

---

#### GET /facturas/:id

Obtener detalle de una factura.

**Response 200 (OK):**
```json
{
  "id": 1,
  "numero_factura": "FAC-2024-0001",
  "fecha": "2024-01-20",
  "subtotal": 150.00,
  "total": 150.00,
  "status": "Pendiente",
  "cliente": {
    "nombre_completo": "Juan Pérez",
    "email": "juan@example.com",
    "telefono": "2234-5678",
    "celular": "1234-5678"
  },
  "vehiculo": {
    "marca": "Toyota",
    "modelo": "Corolla",
    "placa": "ABC-123",
    "anio": 2020,
    "color": "Blanco"
  },
  "reparacion": {
    "tipo_reparacion": "Cambio de aceite",
    "descripcion": "Cambio de aceite y filtro",
    "fecha_inicio": "2024-01-15",
    "fecha_fin": "2024-01-15"
  },
  "servicios": [
    {
      "id": 1,
      "nombre_servicio": "Cambio de filtro de aire",
      "descripcion": "Instalación de nuevo filtro",
      "precio": 87.50
    }
  ]
}
```

**Errores:**
- `403`: No tienes permiso para ver esta factura (clientes solo pueden ver las suyas)
- `404`: Factura no encontrada

---

#### GET /facturas/:id/pdf

Generar y descargar factura en formato PDF.

**Response 200 (OK):**
- Content-Type: `application/pdf`
- Archivo PDF descargable

**Errores:**
- `403`: No tienes permiso para descargar esta factura
- `404`: Factura no encontrada
- `500`: Error al generar PDF

---

#### POST /facturas

Crear una nueva factura desde una reparación. **Mecánicos y administradores.**

**Request Body:**
```json
{
  "reparacion_id": 1,
  "status": "Pendiente"
}
```

**Response 201 (Created):**
```json
{
  "message": "Factura creada exitosamente",
  "factura": {
    "id": 1,
    "numero_factura": "FAC-2024-0001",
    "fecha": "2024-01-20",
    "subtotal": 150.00,
    "total": 150.00,
    "status": "Pendiente"
  }
}
```

**Errores:**
- `400`: reparacion_id es requerido o la reparación no está finalizada
- `403`: No tienes permiso para crear facturas o no puedes generar facturas de reparaciones que no creaste
- `404`: Reparación no encontrada
- `200`: Ya existe una factura para esta reparación (retorna la factura existente)

---

## Códigos de Error Comunes

### Errores de Validación (400)

- `"Campos obligatorios incompletos"`: Faltan campos requeridos en el request
- `"La contraseña debe tener al menos 6 caracteres"`: Contraseña muy corta
- `"precio_unitario debe ser un número mayor o igual a 0"`: Precio inválido
- `"El nombre de la categoría es obligatorio"`: Nombre de categoría vacío
- `"Ya existe una categoría con ese nombre"`: Nombre duplicado
- `"El archivo es demasiado grande (máximo 2MB)"`: Archivo excede el tamaño máximo

### Errores de Autenticación (401)

- `"Token no proporcionado"`: Falta el header Authorization
- `"Token inválido"`: Token malformado o expirado
- `"Credenciales incorrectas"`: Email o contraseña incorrectos

### Errores de Autorización (403)

- `"No tienes permiso para..."`: Usuario sin permisos suficientes
- `"Solo los administradores pueden..."`: Acción restringida a administradores
- `"No puedes editar otros usuarios"`: Intento de editar usuario ajeno

### Errores de Recurso No Encontrado (404)

- `"Usuario no encontrado"`
- `"Vehículo no encontrado"`
- `"Reparación no encontrada"`
- `"Servicio no encontrado"`
- `"Repuesto no encontrado"`
- `"Categoría no encontrada"`
- `"Factura no encontrada"`
- `"Cliente no encontrado"`

### Errores del Servidor (500)

- `"Error en el servidor"`: Error genérico del servidor
- `"Error al registrar vehículo"`: Error específico al crear vehículo
- `"Error al crear repuesto"`: Error específico al crear repuesto
- `"Error al generar PDF"`: Error al generar factura en PDF

---

## Ejemplos de Uso

### Ejemplo Completo: Crear Reparación con Servicio

1. **Autenticarse:**
```bash
POST /auth/login
{
  "email": "mecanico@example.com",
  "contrasena": "password123"
}
```

2. **Crear Reparación:**
```bash
POST /reparaciones
Headers: Authorization: Bearer <token>
Form-data:
  - tipo_reparacion: "Mantenimiento general"
  - descripcion: "Mantenimiento completo del vehículo"
  - fecha_inicio: "2024-01-20"
  - vehiculo_id: 1
  - imagen_antes: [archivo]
```

3. **Crear Servicio para la Reparación:**
```bash
POST /api/servicios
Headers: Authorization: Bearer <token>
{
  "nombre_servicio": "Cambio de aceite y filtros",
  "descripcion": "Cambio completo de aceite y todos los filtros",
  "costo_mano_obra": 50.00,
  "reparacion_id": 1,
  "repuestos": [
    { "repuesto_id": 1, "cantidad": 1 },
    { "repuesto_id": 2, "cantidad": 1 }
  ]
}
```

4. **Cliente aprueba la cotización:**
```bash
PATCH /reparaciones/1/decision-cotizacion
Headers: Authorization: Bearer <token_cliente>
{
  "decision": "aprobada"
}
```

5. **Mecánico finaliza la reparación:**
```bash
PUT /reparaciones/1
Headers: Authorization: Bearer <token>
Form-data:
  - status: "Finalizado"
  - fecha_fin: "2024-01-20"
  - imagen_despues: [archivo]
```

6. **Generar factura:**
```bash
POST /facturas
Headers: Authorization: Bearer <token>
{
  "reparacion_id": 1
}
```

---

## Notas Adicionales

- Todas las fechas deben estar en formato `YYYY-MM-DD`
- Las imágenes deben enviarse como `multipart/form-data`
- El tamaño máximo de archivos es 2MB
- Los precios se manejan en formato decimal (DECIMAL(10,2) en BD)
- Los IDs son numéricos enteros
- Los tokens JWT expiran después de 1 hora
- La paginación está disponible en endpoints que retornan listas

---

**Última actualización:** 2024

