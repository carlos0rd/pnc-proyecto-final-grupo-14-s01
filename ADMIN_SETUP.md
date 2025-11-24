# Configuración de Usuario Administrador

## Usuario Administrador por Defecto

El sistema incluye un usuario administrador creado automáticamente:

- **Email:** `admin@autocare.com`
- **Contraseña:** `admin123`
- **Rol:** Administrador (rol_id = 3)

⚠️ **IMPORTANTE:** Cambia la contraseña después del primer inicio de sesión por seguridad.

## Crear Usuarios Administradores Adicionales

### Opción 1: Desde la Aplicación (Recomendado)

1. Inicia sesión con el usuario administrador por defecto
2. Ve a la sección "Gestión de Usuarios"
3. Busca el usuario que quieres convertir en administrador
4. Edita el usuario y cambia su rol a "Administrador"

### Opción 2: Desde la Base de Datos (Avanzado)

Si necesitas crear un usuario administrador directamente en la base de datos:

```bash
# Ejecutar el script SQL
docker exec -i autocare-db mysql -u root -prootpassword autocarservice < create_admin_user.sql
```

O manualmente:

```bash
docker exec autocare-db mysql -u root -prootpassword autocarservice -e "
INSERT INTO usuarios (nombre_completo, email, contrasena, telefono, celular, rol_id) 
VALUES ('Nombre Admin', 'email@ejemplo.com', '\$2b\$10\$HASH_AQUI', '0000000000', '0000000000', 3)
ON DUPLICATE KEY UPDATE rol_id = 3;"
```

**Nota:** Necesitarás generar el hash de la contraseña primero usando bcrypt.

### Opción 3: Generar Hash de Contraseña

Para crear un nuevo usuario admin con una contraseña personalizada:

```bash
# Generar hash de contraseña
docker exec autocare-backend node -e "const bcrypt = require('bcrypt'); bcrypt.hash('TU_CONTRASEÑA', 10).then(hash => console.log(hash));"

# Luego usar ese hash en el INSERT
```

## Roles Disponibles

- **rol_id = 1:** Cliente
- **rol_id = 2:** Mecánico
- **rol_id = 3:** Administrador

## Scripts Disponibles

- `create_admin_user.sql` - Script para crear/actualizar el usuario administrador por defecto
- `AutoCarService.sql` - Script principal que incluye la creación automática del admin

