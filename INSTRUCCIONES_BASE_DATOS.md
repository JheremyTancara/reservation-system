# 📊 Instrucciones para Crear la Base de Datos

## 🎯 Objetivo
Este documento te guía para crear la base de datos `chatbot_reservas` con todos los restaurantes necesarios.

## 📋 Restaurantes Incluidos

El script creará 3 restaurantes:

1. **Gus Restaurant Group** 
   - Email: admin@gusrestaurant.com
   - Password: admin123
   - Puerto: 3001
   - Subdominio: gus-main
   - Estado: ✅ Activo

2. **Pizza Palace**
   - Email: admin@pizzapalace.com
   - Password: admin321
   - Puerto: 3002
   - Subdominio: pizza-palace
   - Estado: ✅ Activo

3. **Restaurante de Prueba**
   - Email: test@example.com
   - Password: $2b$10$example
   - Puerto: 9999
   - Subdominio: test-restaurant
   - Estado: ⛔ Inactivo

## 🚀 Método 1: Línea de Comandos (PowerShell)

### Opción A: Ejecutar desde PowerShell

```powershell
# Navegar a la carpeta del proyecto
cd "c:\Users\JheremyTancara\Downloads\Proyecto de Grado\restaurant-reservation-system"

# Ejecutar el script SQL
mysql -u root -p < EJECUTAR_BASE_DATOS.sql
```

### Opción B: Con usuario y contraseña específicos

```powershell
mysql -u tu_usuario -p tu_contraseña < EJECUTAR_BASE_DATOS.sql
```

## 🖥️ Método 2: MySQL Workbench (Recomendado)

1. Abre **MySQL Workbench**
2. Conecta a tu servidor MySQL local
3. Ve a **File** → **Open SQL Script**
4. Selecciona el archivo: `EJECUTAR_BASE_DATOS.sql`
5. Haz clic en el icono del rayo ⚡ para ejecutar todo el script
6. Verifica que aparezca: "Base de datos creada exitosamente!"

## 🔧 Método 3: phpMyAdmin

1. Abre **phpMyAdmin** en tu navegador: `http://localhost/phpmyadmin`
2. Ve a la pestaña **SQL**
3. Abre el archivo `EJECUTAR_BASE_DATOS.sql` en un editor de texto
4. Copia todo el contenido
5. Pégalo en la caja de texto de phpMyAdmin
6. Haz clic en **Continuar** o **Go**

## ✅ Verificación

Después de ejecutar el script, verifica que la base de datos se creó correctamente:

```sql
USE chatbot_reservas;

-- Ver todos los restaurantes
SELECT id, nombre, email, puerto, subdominio, activo FROM restaurants;

-- Ver todas las sucursales
SELECT b.id, b.nombre, r.nombre as restaurante 
FROM branches b 
JOIN restaurants r ON b.restaurant_id = r.id;

-- Ver estadísticas
SELECT 
    (SELECT COUNT(*) FROM restaurants) as 'Total Restaurantes',
    (SELECT COUNT(*) FROM branches) as 'Total Sucursales',
    (SELECT COUNT(*) FROM menu_items) as 'Total Items Menu',
    (SELECT COUNT(*) FROM mesas) as 'Total Mesas';
```

## 📊 Estructura Creada

El script crea las siguientes tablas:

1. ✅ `restaurants` - Restaurantes principales
2. ✅ `port_manager` - Gestor de puertos
3. ✅ `branches` - Sucursales
4. ✅ `categorias` - Categorías del menú
5. ✅ `menu_items` - Items del menú
6. ✅ `mesas` - Mesas
7. ✅ `reservas` - Reservas
8. ✅ `reserva_platos` - Platos por reserva
9. ✅ `messages` - Mensajes del chatbot

## 🔍 Datos Iniciales

- **3 Restaurantes** (incluyendo el Restaurante de Prueba)
- **5 Sucursales** (3 de Gus Restaurant, 2 de Pizza Palace)
- **5 Categorías**
- **7 Items del menú**
- **6 Mesas**
- **1 Reserva de ejemplo**

## ⚠️ Notas Importantes

1. ⚠️ **El script eliminará la base de datos existente** si ya existe `chatbot_reservas`
2. 📝 Asegúrate de hacer un respaldo si tienes datos importantes
3. 🔑 Las contraseñas mostradas son de ejemplo. En producción usa contraseñas seguras.
4. 🔒 El "Restaurante de Prueba" está **inactivo** por defecto (activo = 0)

## 🐛 Solución de Problemas

### Error: "Access denied"
```powershell
# Verifica tu usuario y contraseña de MySQL
mysql -u root -p
```

### Error: "Database exists"
El script automáticamente elimina la base de datos si existe. Si quieres mantener datos:
1. Comenta la línea `DROP DATABASE IF EXISTS`
2. Modifica los INSERT para usar `INSERT IGNORE` o `REPLACE INTO`

### Error: "Cannot add foreign key constraint"
Asegúrate de ejecutar el script completo en orden. Las tablas tienen dependencias.

## 📞 Contacto

Si tienes problemas, verifica:
- ✅ MySQL está corriendo
- ✅ Tienes permisos de administrador
- ✅ El puerto 3306 está disponible

---
**Última actualización:** 7 de diciembre de 2025
