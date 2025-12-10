const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware CORS con configuración más permisiva
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para logging de requests (antes de parsear)
app.use((req, res, next) => {
  // Log todas las peticiones a /api/saas-users
  if (req.path.startsWith('/api/saas-users')) {
    console.log("=".repeat(60));
    console.log(`📥 REQUEST: ${req.method} ${req.path}`);
    console.log("📦 Headers:", req.headers);
    console.log("=".repeat(60));
  }
  if (req.path === '/api/auth/login') {
    console.log("🔍 REQUEST LOGIN - Path:", req.path);
    console.log("🔍 REQUEST LOGIN - Method:", req.method);
    console.log("🔍 REQUEST LOGIN - Content-Type:", req.headers['content-type']);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para logging después de parsear
app.use((req, res, next) => {
  if (req.path.startsWith('/api/saas-users')) {
    console.log("📦 Body después de parsear:", req.body);
  }
  if (req.path === '/api/auth/login') {
    console.log("🔍 DESPUÉS DE PARSEAR - req.body:", req.body);
    console.log("🔍 DESPUÉS DE PARSEAR - req.body keys:", req.body ? Object.keys(req.body) : "null");
  }
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Importar rutas
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const configRoutes = require("./routes/config");
const uploadRestaurantRoutes = require("./routes/upload-restaurant");
const saasUsersRoutes = require("./routes/saas-users");
const subscriptionsRoutes = require("./routes/subscriptions");

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || "3306",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "AlejandraVargas12",
  database: process.env.DB_NAME || "chatbot_reservas",
};

// Almacenar instancias de restaurantes activas
const activeInstances = new Map();

// Usar rutas de autenticación
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/config", configRoutes);
app.use("/api/upload-restaurant", uploadRestaurantRoutes);
app.use("/api/saas-users", saasUsersRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);

// Log para verificar que las rutas se registraron
console.log("✅ Rutas registradas:");
console.log("  - /api/auth");
console.log("  - /api/saas-users");
console.log("  - /api/subscriptions");

// Función para conectar a la base de datos
async function connectDB() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("✅ Conexión exitosa a la base de datos maestra");
    return connection;
  } catch (error) {
    console.error("❌ Error conectando a la base de datos:", error);
    throw error;
  }
}

// Función para generar subdominio único
function generateSubdomain(restaurantName) {
  return restaurantName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Función para obtener el siguiente puerto disponible (empezando desde 3001)
// Nota: calculamos solo en base a los restaurantes existentes para evitar “saltar” puertos
async function getNextAvailablePort() {
  const connection = await connectDB();
  try {
    const [existingRestaurants] = await connection.execute(
      "SELECT puerto FROM restaurants WHERE puerto IS NOT NULL"
    );

    const occupied = new Set();
    existingRestaurants.forEach((r) => {
      if (r.puerto) occupied.add(r.puerto);
    });

    let nextPort = 3001;
    while (occupied.has(nextPort)) {
      nextPort++;
    }

    return nextPort;
  } finally {
    await connection.end();
  }
}

// Función para iniciar una instancia de restaurante
async function startRestaurantInstance(restaurant) {
  try {
    const instancePort = restaurant.puerto;
    const subdomain = restaurant.subdominio;

    console.log(
      `🚀 Iniciando instancia para ${restaurant.nombre} en puerto ${instancePort}`
    );

    // Crear proceso hijo para la instancia del restaurante
    const child = spawn("node", ["tenant-server.js"], {
      cwd: __dirname,
      env: {
        ...process.env,
        TENANT_PORT: instancePort,
        TENANT_ID: restaurant.id,
        TENANT_SUBDOMAIN: subdomain,
        TENANT_NAME: restaurant.nombre,
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Manejar salida del proceso hijo
    child.stdout.on("data", (data) => {
      console.log(
        `[${restaurant.nombre}:${instancePort}] ${data.toString().trim()}`
      );
    });

    child.stderr.on("data", (data) => {
      console.error(
        `[${restaurant.nombre}:${instancePort}] ERROR: ${data
          .toString()
          .trim()}`
      );
    });

    child.on("close", (code) => {
      console.log(
        `[${restaurant.nombre}:${instancePort}] Proceso terminado con código ${code}`
      );
      activeInstances.delete(restaurant.id);
    });

    // Almacenar la instancia activa
    activeInstances.set(restaurant.id, {
      process: child,
      port: instancePort,
      subdomain: subdomain,
      restaurant: restaurant,
    });

    return true;
  } catch (error) {
    console.error(
      `❌ Error iniciando instancia para ${restaurant.nombre}:`,
      error
    );
    return false;
  }
}

// Función para cargar y iniciar todos los restaurantes activos
async function loadActiveRestaurants() {
  const connection = await connectDB();
  try {
    const [restaurants] = await connection.execute(
      "SELECT * FROM restaurants WHERE activo = true"
    );

    console.log(`📋 Cargando ${restaurants.length} restaurantes activos...`);

    for (const restaurant of restaurants) {
      await startRestaurantInstance(restaurant);
      // Pequeña pausa entre inicios para evitar conflictos
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } finally {
    await connection.end();
  }
}

// RUTAS DEL SERVIDOR MAESTRO

// Ruta de prueba
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend funcionando correctamente", timestamp: new Date() });
});

// Ruta de prueba para saas-users
app.get("/api/saas-users/test", (req, res) => {
  res.json({ message: "Ruta saas-users funcionando correctamente", timestamp: new Date() });
});

// 1. Crear nuevo restaurante
app.post("/api/restaurants", async (req, res) => {
  try {
    const { nombre, email, password, telefono, direccion } = req.body;

    if (!nombre || !email || !password) {
      return res
        .status(400)
        .json({ error: "Nombre, email y password son requeridos" });
    }

    const connection = await connectDB();

    // Generar subdominio único
    let subdomain = generateSubdomain(nombre);
    let counter = 1;
    let finalSubdomain = subdomain;

    // Verificar que el subdominio sea único
    while (true) {
      const [existing] = await connection.execute(
        "SELECT id FROM restaurants WHERE subdominio = ?",
        [finalSubdomain]
      );

      if (existing.length === 0) break;
      finalSubdomain = `${subdomain}-${counter}`;
      counter++;
    }

    // Obtener puerto disponible
    const port = await getNextAvailablePort();

    // Encriptar password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear restaurante en la base de datos
    const [result] = await connection.execute(
      "INSERT INTO restaurants (nombre, email, password, telefono, direccion, puerto, subdominio) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [nombre, email, hashedPassword, telefono, direccion, port, finalSubdomain]
    );

    const restaurantId = result.insertId;

    // Obtener el restaurante creado
    const [restaurants] = await connection.execute(
      "SELECT * FROM restaurants WHERE id = ?",
      [restaurantId]
    );

    const newRestaurant = restaurants[0];

    // Iniciar instancia del restaurante
    const instanceStarted = await startRestaurantInstance(newRestaurant);

    await connection.end();

    if (instanceStarted) {
      res.status(201).json({
        message: "Restaurante creado exitosamente",
        restaurant: {
          id: newRestaurant.id,
          nombre: newRestaurant.nombre,
          email: newRestaurant.email,
          puerto: newRestaurant.puerto,
          subdominio: newRestaurant.subdominio,
          url: `http://${newRestaurant.subdominio}.localhost:${newRestaurant.puerto}`,
        },
      });
    } else {
      res
        .status(500)
        .json({ error: "Error iniciando la instancia del restaurante" });
    }
  } catch (error) {
    console.error("Error creando restaurante:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// 2. Listar todos los restaurantes
app.get("/api/restaurants", async (req, res) => {
  try {
    const connection = await connectDB();
    const [restaurants] = await connection.execute(
      `SELECT r.id, r.nombre, r.email, r.telefono, r.direccion, r.puerto, r.subdominio, r.activo, 
              r.created_at, r.subscription_status, r.user_id, r.payment_proof_path, r.logo_path, 
              r.cover_path, r.last_updated, r.admin_notes,
              u.email as user_email, u.full_name as user_name
       FROM restaurants r
       LEFT JOIN users u ON r.user_id = u.id`
    );

    // Agregar información de estado de las instancias
    const restaurantsWithStatus = restaurants.map((restaurant) => ({
      ...restaurant,
      instanceActive: activeInstances.has(restaurant.id),
      url: `http://${restaurant.subdominio}.localhost:${restaurant.puerto}`,
      subscription_status: restaurant.subscription_status || 'active', // Por defecto 'active' para restaurantes antiguos
    }));

    await connection.end();
    res.json(restaurantsWithStatus);
  } catch (error) {
    console.error("Error listando restaurantes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// 3. Obtener restaurante por ID
app.get("/api/restaurants/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await connectDB();
    const [restaurants] = await connection.execute(
      "SELECT id, nombre, email, telefono, direccion, puerto, subdominio, activo, created_at, logo_url, imagen_url, background_url, carrusel_images, divisa FROM restaurants WHERE id = ?",
      [id]
    );

    await connection.end();

    if (restaurants.length === 0) {
      return res.status(404).json({ error: "Restaurante no encontrado" });
    }

    const restaurant = restaurants[0];
    restaurant.instanceActive = activeInstances.has(restaurant.id);
    restaurant.url = `http://${restaurant.subdominio}.localhost:${restaurant.puerto}`;
    restaurant.carrusel_images = restaurant.carrusel_images ? JSON.parse(restaurant.carrusel_images) : null;

    res.json(restaurant);
  } catch (error) {
    console.error("Error obteniendo restaurante:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// 4. Actualizar restaurante
app.put("/api/restaurants/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, direccion, activo, logo_url, imagen_url, background_url, carrusel_images, divisa } = req.body;

    const connection = await connectDB();

    // Verificar que el restaurante existe
    const [existing] = await connection.execute(
      "SELECT * FROM restaurants WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      await connection.end();
      return res.status(404).json({ error: "Restaurante no encontrado" });
    }

    // Construir query dinámico solo con los campos proporcionados
    const updates = [];
    const values = [];

    if (nombre !== undefined) {
      updates.push("nombre = ?");
      values.push(nombre);
    }
    if (email !== undefined) {
      updates.push("email = ?");
      values.push(email);
    }
    if (telefono !== undefined) {
      updates.push("telefono = ?");
      values.push(telefono);
    }
    if (direccion !== undefined) {
      updates.push("direccion = ?");
      values.push(direccion);
    }
    if (activo !== undefined) {
      updates.push("activo = ?");
      values.push(activo);
    }
    if (logo_url !== undefined) {
      updates.push("logo_url = ?");
      values.push(logo_url);
    }
    if (imagen_url !== undefined) {
      updates.push("imagen_url = ?");
      values.push(imagen_url);
    }
    if (background_url !== undefined) {
      updates.push("background_url = ?");
      values.push(background_url);
    }
    if (carrusel_images !== undefined) {
      updates.push("carrusel_images = ?");
      values.push(typeof carrusel_images === 'string' ? carrusel_images : JSON.stringify(carrusel_images));
    }
    if (divisa !== undefined) {
      updates.push("divisa = ?");
      values.push(divisa);
    }

    if (updates.length === 0) {
      await connection.end();
      return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    values.push(id);

    // Actualizar restaurante
    await connection.execute(
      `UPDATE restaurants SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    // Si se desactivó, detener la instancia
    if (activo === false && activeInstances.has(parseInt(id))) {
      const instance = activeInstances.get(parseInt(id));
      instance.process.kill();
      activeInstances.delete(parseInt(id));
    }

    // Si se activó, iniciar la instancia
    if (activo === true && !activeInstances.has(parseInt(id))) {
      const [restaurants] = await connection.execute(
        "SELECT * FROM restaurants WHERE id = ?",
        [id]
      );
      if (restaurants.length > 0) {
        await startRestaurantInstance(restaurants[0]);
      }
    }

    await connection.end();
    res.json({ message: "Restaurante actualizado exitosamente" });
  } catch (error) {
    console.error("Error actualizando restaurante:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// 5. Eliminar restaurante
app.delete("/api/restaurants/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await connectDB();

    // Verificar que el restaurante existe
    const [existing] = await connection.execute(
      "SELECT * FROM restaurants WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      await connection.end();
      return res.status(404).json({ error: "Restaurante no encontrado" });
    }

    // Detener instancia si está activa
    if (activeInstances.has(parseInt(id))) {
      const instance = activeInstances.get(parseInt(id));
      instance.process.kill();
      activeInstances.delete(parseInt(id));
    }

    // Eliminar restaurante (cascade eliminará branches, etc.)
    await connection.execute("DELETE FROM restaurants WHERE id = ?", [id]);

    await connection.end();
    res.json({ message: "Restaurante eliminado exitosamente" });
  } catch (error) {
    console.error("Error eliminando restaurante:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// 6. Reiniciar instancia de restaurante
app.post("/api/restaurants/:id/restart", async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await connectDB();

    const [restaurants] = await connection.execute(
      "SELECT * FROM restaurants WHERE id = ?",
      [id]
    );

    await connection.end();

    if (restaurants.length === 0) {
      return res.status(404).json({ error: "Restaurante no encontrado" });
    }

    const restaurant = restaurants[0];

    // Detener instancia actual si existe
    if (activeInstances.has(parseInt(id))) {
      const instance = activeInstances.get(parseInt(id));
      instance.process.kill();
      activeInstances.delete(parseInt(id));
    }

    // Iniciar nueva instancia
    const instanceStarted = await startRestaurantInstance(restaurant);

    if (instanceStarted) {
      res.json({ message: "Instancia reiniciada exitosamente" });
    } else {
      res.status(500).json({ error: "Error reiniciando la instancia" });
    }
  } catch (error) {
    console.error("Error reiniciando instancia:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// 7. Estado del sistema
app.get("/api/system/status", async (req, res) => {
  try {
    const connection = await connectDB();
    const [restaurants] = await connection.execute(
      "SELECT id, nombre, puerto, subdominio, activo FROM restaurants"
    );

    await connection.end();

    const systemStatus = {
      masterPort: PORT,
      totalRestaurants: restaurants.length,
      activeInstances: activeInstances.size,
      restaurants: restaurants.map((restaurant) => ({
        ...restaurant,
        instanceActive: activeInstances.has(restaurant.id),
        url: `http://${restaurant.subdominio}.localhost:${restaurant.puerto}`,
      })),
    };

    res.json(systemStatus);
  } catch (error) {
    console.error("Error obteniendo estado del sistema:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({
    message: "Servidor Maestro Multi-Tenancy",
    status: "Activo",
    port: PORT,
    endpoints: {
      restaurants: "/api/restaurants",
      systemStatus: "/api/system/status",
    },
  });
});

// Iniciar servidor maestro
app.listen(PORT, async () => {
  console.log(`🚀 Servidor Maestro iniciado en puerto ${PORT}`);
  console.log(`📊 Cargando restaurantes activos...`);

  try {
    await loadActiveRestaurants();
    // Imprimir credenciales de restaurantes activos
    const connection = await connectDB();
    const [restaurants] = await connection.execute(
      "SELECT nombre, email, puerto FROM restaurants WHERE activo = true"
    );
    await connection.end();
    console.log("\n🔑 Credenciales de restaurantes activos:");
    restaurants.forEach((r) => {
      console.log(`- ${r.nombre}: email='${r.email}' | puerto=${r.puerto}`);
    });
    console.log();
    console.log(`✅ Sistema multi-tenancy listo`);
    console.log(
      `🌐 Accede al panel de control: http://localhost:${PORT}/master`
    );
    console.log(`🔗 API disponible en: http://localhost:${PORT}/api`);
  } catch (error) {
    console.error("❌ Error cargando restaurantes:", error);
  }
});

// Manejo de señales para cerrar limpiamente
process.on("SIGINT", async () => {
  console.log("\n🛑 Cerrando servidor maestro...");

  // Detener todas las instancias activas
  for (const [id, instance] of activeInstances) {
    console.log(`🛑 Deteniendo instancia ${instance.restaurant.nombre}...`);
    instance.process.kill();
  }

  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Cerrando servidor maestro...");

  for (const [id, instance] of activeInstances) {
    instance.process.kill();
  }

  process.exit(0);
});