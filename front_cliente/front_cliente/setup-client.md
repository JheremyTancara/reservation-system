# 🍽️ Frontend Cliente Multi-Tenancy

## 📋 Descripción

El frontend cliente ha sido actualizado para funcionar con el sistema multi-tenancy. Ahora puede detectar automáticamente el restaurante basado en el subdominio y conectarse a la instancia correspondiente.

## 🚀 Configuración

### 1. Instalar Dependencias

```bash
cd front_cliente/front_cliente
npm install
```

### 2. Configurar DNS Local

Sigue las instrucciones en `setup-dns.md` para configurar los subdominios locales.

### 3. Iniciar el Frontend Cliente

```bash
npm run dev
```

## 🌐 URLs de Acceso

### Panel de Selección (localhost sin subdominio)

```
http://localhost:5173
```

- Muestra lista de restaurantes disponibles
- Permite seleccionar el restaurante deseado

### Acceso Directo por Subdominio

```
http://gus-main.localhost:5173
http://pizza-palace.localhost:5173
http://test-restaurant.localhost:5173
```

- Detecta automáticamente el restaurante
- Conecta directamente a la instancia correspondiente

## 🔧 Funcionalidades

### Detección Automática de Restaurante

- Analiza el subdominio de la URL
- Consulta al servidor maestro para obtener el puerto
- Conecta a la instancia específica del restaurante

### Selector de Restaurantes

- Lista todos los restaurantes activos
- Muestra información de cada restaurante
- Redirección automática al subdominio seleccionado

### ChatBot Multi-Tenant

- Adapta el contenido según el restaurante
- Usa la API específica de cada instancia
- Mantiene el contexto del restaurante seleccionado

## 📱 Experiencia de Usuario

### 1. Acceso Inicial

- Usuario accede a `localhost:5173`
- Ve lista de restaurantes disponibles
- Selecciona su restaurante preferido

### 2. Redirección Automática

- Sistema redirige al subdominio específico
- URL cambia a `[subdominio].localhost:5173`
- ChatBot se conecta a la instancia correcta

### 3. Interacción con el Restaurante

- Todas las operaciones son específicas del restaurante
- Menú, sucursales y reservas del restaurante seleccionado
- Aislamiento completo de datos

## 🔄 Flujo de Trabajo

```
Usuario → localhost:5173 → Selector → [subdominio].localhost:5173 → ChatBot
```

1. **Acceso inicial**: Usuario ve selector de restaurantes
2. **Selección**: Elige restaurante de la lista
3. **Redirección**: Sistema redirige al subdominio específico
4. **Conexión**: ChatBot se conecta a la instancia del restaurante
5. **Interacción**: Usuario interactúa con el restaurante específico

## 🛠️ Configuración Técnica

### Variables de Entorno

Crear archivo `.env`:

```env
VITE_MASTER_API_URL=http://localhost:3000/api
VITE_DEFAULT_PORT=5173
```

### Proxy Configuration

El archivo `vite.config.js` incluye:

- Proxy para servidor maestro
- Proxy para instancias de restaurantes
- Configuración de CORS

### API Dinámica

El archivo `api.js` detecta automáticamente:

- Subdominio actual
- Puerto correspondiente
- URL de la API específica

## 🚨 Solución de Problemas

### Error: "Restaurante no encontrado"

1. Verificar que el restaurante esté activo en el servidor maestro
2. Comprobar que la instancia esté ejecutándose
3. Verificar configuración de DNS local

### Error: "Error conectando con el restaurante"

1. Verificar que el servidor maestro esté ejecutándose
2. Comprobar que la instancia del restaurante esté activa
3. Verificar puertos y configuración de red

### Error: "No se pudieron cargar los restaurantes"

1. Verificar conexión al servidor maestro
2. Comprobar que el servidor maestro esté en puerto 3000
3. Verificar configuración de CORS

## 📊 Monitoreo

### Logs del Cliente

- Errores de conexión
- Detección de restaurantes
- Redirecciones realizadas

### Estado de Conexión

- Estado del servidor maestro
- Estado de las instancias
- Disponibilidad de restaurantes

## 🔒 Seguridad

### Aislamiento de Datos

- Cada restaurante solo ve sus propios datos
- No hay acceso cruzado entre restaurantes
- Filtrado automático por `restaurant_id`

### Validación de Subdominios

- Verificación de subdominios válidos
- Redirección a selector si subdominio no existe
- Manejo de errores de conexión

## 🎯 Próximos Pasos

1. **Configurar DNS local** siguiendo `setup-dns.md`
2. **Iniciar servidor maestro** en puerto 3000
3. **Iniciar frontend cliente** en puerto 5173
4. **Probar acceso** a diferentes subdominios
5. **Verificar funcionalidad** del ChatBot

---

**Frontend Cliente Multi-Tenancy Configurado** ✅
