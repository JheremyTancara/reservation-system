# 🏪 Sistema Multi-Tenancy Gus Restaurant Group

## 📋 Descripción General

Sistema de gestión de restaurantes con arquitectura multi-tenancy basada en puertos y subdominios. Cada restaurante opera de forma completamente aislada en su propia instancia de servidor con puerto dedicado.

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **Servidor Maestro (Puerto 3000)**

   - Gestión central de restaurantes
   - Asignación automática de puertos
   - Proxy reverso para subdominios
   - Panel de control administrativo

2. **Servidores de Instancia (Puertos 3001+)**

   - Servidor dedicado por restaurante
   - Aislamiento completo de datos
   - API específica por tenant

3. **Base de Datos Multi-Tenant**
   - Tabla `restaurants` como entidad principal
   - Todas las tablas incluyen `restaurant_id`
   - Aislamiento de datos por restaurante

### Estructura de URLs

```
Panel de Control: http://localhost:3000/master
API Maestra: http://localhost:3000/api
Restaurante 1: http://gus-main.localhost:3001
Restaurante 2: http://pizza-palace.localhost:3002
```

## 🚀 Instalación y Configuración

### 1. Requisitos Previos

- Node.js 16+
- MySQL 8.0+
- npm o yarn

### 2. Configuración de la Base de Datos

```sql
-- Ejecutar el archivo SQL
mysql -u root -p < proyecto_chatboot.sql
```

### 3. Configuración del Backend

```bash
cd backend/backend
npm install
npm run setup
```

### 4. Variables de Entorno

Crear archivo `.env` en `backend/backend/`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=chatbot_reservas
JWT_SECRET=tu_jwt_secret
```

### 5. Iniciar el Sistema

```bash
# Iniciar servidor maestro
npm start

# En otra terminal, iniciar frontend
cd ../../frontend/frontend
npm install
npm run dev
```

## 📊 Estructura de la Base de Datos

### Tablas Principales

1. **restaurants** - Entidad principal multi-tenant
2. **branches** - Sucursales por restaurante
3. **categorias** - Categorías de menú por restaurante
4. **menu_items** - Items del menú
5. **mesas** - Mesas por sucursal
6. **reservas** - Reservas de clientes
7. **reserva_platos** - Platos por reserva
8. **messages** - Mensajes del chatbot
9. **port_manager** - Gestión de puertos

### Relaciones

```
restaurants (1) ←→ (N) branches
restaurants (1) ←→ (N) categorias
restaurants (1) ←→ (N) menu_items
restaurants (1) ←→ (N) mesas
restaurants (1) ←→ (N) reservas
restaurants (1) ←→ (N) messages
```

## 🔧 API Endpoints

### Servidor Maestro (Puerto 3000)

#### Gestión de Restaurantes

- `POST /api/restaurants` - Crear restaurante
- `GET /api/restaurants` - Listar restaurantes
- `GET /api/restaurants/:id` - Obtener restaurante
- `PUT /api/restaurants/:id` - Actualizar restaurante
- `DELETE /api/restaurants/:id` - Eliminar restaurante
- `POST /api/restaurants/:id/restart` - Reiniciar instancia

#### Estado del Sistema

- `GET /api/system/status` - Estado general del sistema

### Servidor de Instancia (Puertos 3001+)

#### Autenticación

- `POST /api/auth/login` - Login del restaurante

#### Gestión de Datos

- `GET /api/branches` - Obtener sucursales
- `POST /api/branches` - Crear sucursal
- `GET /api/categorias` - Obtener categorías
- `POST /api/categorias` - Crear categoría
- `GET /api/menu` - Obtener menú
- `POST /api/menu` - Crear item de menú
- `GET /api/mesas` - Obtener mesas
- `POST /api/mesas` - Crear mesa
- `GET /api/reservas` - Obtener reservas
- `POST /api/reservas` - Crear reserva
- `PUT /api/reservas/:id/estado` - Actualizar estado de reserva
- `GET /api/dashboard` - Dashboard del restaurante

## 🎯 Flujo de Trabajo

### 1. Creación de Restaurante

1. Acceder al panel de control: `http://localhost:3000/master`
2. Crear nuevo restaurante con datos básicos
3. Sistema asigna automáticamente:
   - Puerto único (3001, 3002, 3003...)
   - Subdominio basado en nombre
   - Instancia de servidor dedicada

### 2. Gestión de Restaurante

1. Acceder a la instancia: `http://[subdominio].localhost:[puerto]`
2. Login con credenciales del restaurante
3. Gestionar sucursales, menú, reservas, etc.

### 3. Operaciones de Cliente

1. Cliente accede al subdominio del restaurante
2. Realiza reservas, ve menú, etc.
3. Datos completamente aislados por restaurante

## 🔒 Seguridad y Aislamiento

### Aislamiento de Datos

- Cada restaurante solo ve sus propios datos
- Filtrado automático por `restaurant_id`
- Sin acceso cruzado entre restaurantes

### Autenticación

- JWT tokens por instancia
- Tokens específicos por restaurante
- Middleware de autenticación en cada endpoint

### Proxy Reverso

- Redirección basada en subdominios
- Aislamiento de tráfico por instancia
- Manejo de errores centralizado

## 📈 Escalabilidad

### Horizontal

- Nuevos restaurantes = nuevas instancias
- Sin límite teórico de restaurantes
- Carga distribuida por puertos

### Vertical

- Recursos dedicados por instancia
- Configuración independiente por restaurante
- Monitoreo individual de rendimiento

## 🛠️ Mantenimiento

### Logs

- Logs separados por instancia
- Logs centralizados del servidor maestro
- Monitoreo de estado de instancias

### Backups

- Backup por restaurante
- Backup completo de la base de datos
- Restauración granular

### Actualizaciones

- Actualización independiente por instancia
- Rollback individual
- Testing por restaurante

## 🚨 Troubleshooting

### Problemas Comunes

1. **Puerto ya en uso**

   - Verificar `port_manager` en la base de datos
   - Reiniciar servidor maestro

2. **Subdominio no funciona**

   - Verificar configuración de DNS local
   - Comprobar proxy reverso

3. **Instancia no inicia**

   - Verificar variables de entorno
   - Revisar logs de la instancia

4. **Datos no aparecen**
   - Verificar `restaurant_id` en consultas
   - Comprobar filtros de tenant

### Comandos Útiles

```bash
# Verificar estado del sistema
curl http://localhost:3000/api/system/status

# Reiniciar instancia específica
curl -X POST http://localhost:3000/api/restaurants/1/restart

# Verificar instancia de restaurante
curl http://gus-main.localhost:3001/api/tenant/info
```

## 📞 Soporte

Para soporte técnico o consultas sobre el sistema multi-tenancy:

- Revisar logs del servidor maestro
- Verificar configuración de la base de datos
- Comprobar variables de entorno
- Validar estructura de archivos

## 🔄 Versiones

- **v1.0.0** - Implementación inicial del sistema multi-tenancy
- **v1.1.0** - Mejoras en proxy reverso y gestión de puertos
- **v1.2.0** - Panel de control maestro y monitoreo

---

**Desarrollado por Gus Restaurant Group** 🍽️
