const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");

const router = express.Router();

// Middleware para logging de requests de login
router.use("/login", (req, res, next) => {
  console.log("🔍 MIDDLEWARE LOGIN - Request recibido");
  console.log("📦 req.body antes de procesar:", req.body);
  console.log("📦 req.method:", req.method);
  console.log("📦 req.headers['content-type']:", req.headers['content-type']);
  next();
});

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || "3306",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "AlejandraVargas12",
  database: process.env.DB_NAME || "chatbot_reservas",
};

// Función para conectar a la base de datos
async function connectDB() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    return connection;
  } catch (error) {
    console.error("❌ Error conectando a la base de datos:", error);
    throw error;
  }
}

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "tu_secreto_jwt_super_seguro";

// 1. Login de usuario
router.post("/login", async (req, res) => {
  let connection;
  try {
    // Logs detallados para depuración
    console.log("=".repeat(50));
    console.log("🔐 LOGIN REQUEST RECIBIDO");
    console.log("📦 req.body:", req.body);
    console.log("📦 req.body type:", typeof req.body);
    console.log("📦 req.body keys:", req.body ? Object.keys(req.body) : "null");
    console.log("📦 Content-Type header:", req.headers['content-type']);
    console.log("📦 Raw headers:", JSON.stringify(req.headers));
    
    // Verificar si el body está vacío o undefined
    if (!req.body || Object.keys(req.body).length === 0) {
      console.log("❌ PROBLEMA: Body está vacío o no parseado");
      console.log("📦 req.body value:", req.body);
      return res.status(400).json({ error: "Email y password son requeridos" });
    }
    
    // Obtener datos del body - intentar múltiples formas
    let emailOrName = req.body.emailOrName;
    let password = req.body.password;
    
    // Si no están, intentar otros nombres posibles
    if (!emailOrName) {
      emailOrName = req.body.email || req.body.nombre || req.body.username || null;
    }
    if (!password) {
      password = req.body.pass || req.body.pwd || null;
    }

    console.log("🔐 Datos extraídos del body:", { 
      emailOrName: emailOrName ? `${emailOrName.substring(0, 10)}...` : "NULL",
      password: password ? "***" : "NULL",
      emailOrNameType: typeof emailOrName,
      passwordType: typeof password
    });

    // Validar que los campos existan y no estén vacíos
    if (!password) {
      console.log("❌ Password es null/undefined");
      return res.status(400).json({ error: "Email y password son requeridos" });
    }
    
    if (typeof password === 'string' && password.trim().length === 0) {
      console.log("❌ Password está vacío (solo espacios)");
      return res.status(400).json({ error: "Email y password son requeridos" });
    }

    if (!emailOrName) {
      console.log("❌ EmailOrName es null/undefined");
      return res.status(400).json({ error: "Email y password son requeridos" });
    }
    
    if (typeof emailOrName === 'string' && emailOrName.trim().length === 0) {
      console.log("❌ EmailOrName está vacío (solo espacios)");
      return res.status(400).json({ error: "Email y password son requeridos" });
    }

    // Limpiar espacios en blanco
    const trimmedEmailOrName = String(emailOrName).trim();
    const trimmedPassword = String(password).trim();
    
    // Obtener puerto de la petición (si está presente)
    const puertoPeticion = req.body.puerto ? String(req.body.puerto).trim() : null;
    
    console.log("✅ Datos validados correctamente");
    console.log("🔍 Puerto de la petición:", puertoPeticion);
    console.log("=".repeat(50));

    // Si el puerto de la petición es 5173 o está vacío, no verificar puerto (puerto principal)
    const esPuertoPrincipal = !puertoPeticion || puertoPeticion === "" || puertoPeticion === "5173";

    connection = await connectDB();

    // Buscar usuario por email o nombre (case-insensitive)
    let [users] = await connection.execute(
      "SELECT * FROM restaurants WHERE (LOWER(email) = LOWER(?) OR LOWER(nombre) = LOWER(?)) AND activo = true",
      [trimmedEmailOrName, trimmedEmailOrName]
    );

    console.log(`🔍 Usuarios encontrados: ${users.length}`);

    if (users.length === 0) {
      if (connection) {
        await connection.end();
      }
      console.log("❌ Usuario no encontrado en la base de datos");
      return res.status(401).json({ 
        error: "No se puede iniciar sesión porque el usuario no existe. Verifica tus credenciales e intenta nuevamente."
      });
    }

    const user = users[0];
    console.log(`✅ Usuario encontrado: ${user.nombre} (ID: ${user.id}, Puerto: ${user.puerto})`);
    
    // VERIFICACIÓN CRÍTICA: Si NO es el puerto principal (5173), verificar que el puerto coincida
    // ANTES de verificar la contraseña
    if (!esPuertoPrincipal && puertoPeticion) {
      const userPuertoStr = String(user.puerto || "").trim();
      const peticionPuertoStr = String(puertoPeticion).trim();
      
      console.log("🔍 Verificando puerto ANTES de verificar contraseña (puerto de tenant):", {
        user_puerto: userPuertoStr,
        peticion_puerto: peticionPuertoStr,
        coinciden: userPuertoStr === peticionPuertoStr
      });
      
      if (userPuertoStr !== peticionPuertoStr) {
        if (connection) {
          await connection.end();
        }
        console.error("❌ ACCESO DENEGADO: Puerto del restaurante no coincide con el puerto de la petición", {
          user_puerto: userPuertoStr,
          peticion_puerto: peticionPuertoStr,
          restaurant: user.nombre
        });
        return res.status(401).json({ 
          error: "Credenciales inválidas"
        });
      }
      
      console.log("✅ Puerto verificado correctamente, continuando con verificación de contraseña");
    } else if (esPuertoPrincipal) {
      console.log("✅ Puerto principal (5173) - No se verifica puerto, permitiendo login de cualquier restaurante");
    }
    
    console.log(`🔑 Password en DB: ${user.password ? 'existe' : 'null'} (tipo: ${typeof user.password})`);

    // Verificar password con bcrypt (si está hasheado) o texto plano (para compatibilidad)
    let passwordValid = false;
    
    if (!user.password) {
      if (connection) {
        await connection.end();
      }
      console.log("❌ Usuario sin password en la base de datos");
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
      // Password está hasheado con bcrypt
      console.log("🔐 Verificando password hasheado con bcrypt");
      passwordValid = await bcrypt.compare(trimmedPassword, user.password);
      console.log(`🔐 Resultado bcrypt: ${passwordValid}`);
    } else {
      // Password en texto plano (para compatibilidad con usuarios antiguos)
      console.log("🔐 Comparando password en texto plano");
      passwordValid = trimmedPassword === user.password;
      console.log(`🔐 Resultado comparación: ${passwordValid}`);
    }

    if (!passwordValid) {
      if (connection) {
        await connection.end();
      }
      console.log("❌ Password incorrecto");
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Verificar si el restaurante está activo
    if (!user.activo) {
      if (connection) {
        await connection.end();
      }
      console.log("❌ Restaurante desactivado");
      return res.status(403).json({ error: "Restaurante desactivado" });
    }

    console.log("✅ Password válido, generando token...");

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: "admin",
        restaurant_id: user.id,
        puerto: user.puerto,
        subdominio: user.subdominio,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Enviar respuesta sin password
    const userResponse = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono,
      direccion: user.direccion,
      puerto: user.puerto,
      subdominio: user.subdominio,
      activo: user.activo,
      rol: "admin",
      restaurant_id: user.id,
      logo_url: user.logo_url,
      imagen_url: user.imagen_url,
      background_url: user.background_url,
      carrusel_images: user.carrusel_images ? (typeof user.carrusel_images === 'string' ? JSON.parse(user.carrusel_images) : user.carrusel_images) : null,
      divisa: user.divisa || 'BS',
    };

    // Cerrar conexión antes de enviar respuesta
    if (connection) {
      await connection.end();
    }

    console.log("✅ Login exitoso para:", user.nombre);
    res.json({
      message: "Login exitoso",
      user: userResponse,
      token: token,
    });
  } catch (error) {
    console.error("❌ Error en login:", error);
    console.error("Stack trace:", error.stack);
    
    // Cerrar conexión si está abierta
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error("Error cerrando conexión:", closeError);
      }
    }
    
    res.status(500).json({ 
      error: error.message || "Error interno del servidor",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 2. Registro de usuario (nuevo restaurante)
router.post("/register", async (req, res) => {
  try {
    const { nombre, email, password, telefono, direccion } = req.body;

    if (!nombre || !email || !password) {
      return res
        .status(400)
        .json({ error: "Nombre, email y password son requeridos" });
    }

    const connection = await connectDB();

    // Verificar si el email ya existe
    const [existingUsers] = await connection.execute(
      "SELECT id FROM restaurants WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      await connection.end();
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // Generar subdominio único
    let subdomain = nombre
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

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

    // Obtener puerto disponible (empezando desde 3003)
    const [portManager] = await connection.execute(
      "SELECT * FROM port_manager WHERE id = 1"
    );

    let nextPort = 3003; // Empezar desde 3003
    if (portManager.length > 0) {
      const manager = portManager[0];
      let occupiedPorts = [];
      try {
        const portsData = manager.puertos_ocupados;
        if (portsData) {
          occupiedPorts = typeof portsData === 'string' ? JSON.parse(portsData) : portsData;
        }
      } catch (e) {
        occupiedPorts = [];
      }

      // Obtener todos los puertos ocupados de restaurantes existentes
      const [existingRestaurants] = await connection.execute(
        "SELECT puerto FROM restaurants WHERE puerto IS NOT NULL"
      );
      const allOccupiedPorts = new Set(occupiedPorts);
      existingRestaurants.forEach(r => {
        if (r.puerto) allOccupiedPorts.add(r.puerto);
      });

      // Encontrar el siguiente puerto disponible desde 3003
      nextPort = 3003;
      while (allOccupiedPorts.has(nextPort)) {
        nextPort++;
      }

      // Actualizar port manager
      allOccupiedPorts.add(nextPort);
      const updatedPorts = Array.from(allOccupiedPorts);
      await connection.execute(
        "UPDATE port_manager SET puerto_actual = ?, puertos_ocupados = ? WHERE id = 1",
        [nextPort, JSON.stringify(updatedPorts)]
      );
    } else {
      // Crear port manager si no existe, empezando desde 3003
      await connection.execute(
        "INSERT INTO port_manager (puerto_inicio, puerto_actual, puertos_ocupados) VALUES (3000, 3003, JSON_ARRAY(3003))"
      );
    }

    // Encriptar password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear restaurante
    const [result] = await connection.execute(
      "INSERT INTO restaurants (nombre, email, password, telefono, direccion, puerto, subdominio, activo) VALUES (?, ?, ?, ?, ?, ?, ?, true)",
      [
        nombre,
        email,
        hashedPassword,
        telefono,
        direccion,
        nextPort,
        finalSubdomain,
      ]
    );

    const restaurantId = result.insertId;

    // Obtener el restaurante creado
    const [restaurants] = await connection.execute(
      "SELECT * FROM restaurants WHERE id = ?",
      [restaurantId]
    );

    const newRestaurant = restaurants[0];

    // Iniciar instancia del tenant (importar función desde master-server si es necesario)
    // Por ahora, el master-server debería detectar el nuevo restaurante y iniciarlo automáticamente
    // Pero podemos intentar iniciarlo manualmente aquí también
    try {
      const { spawn } = require("child_process");
      const path = require("path");
      
      const child = spawn("node", ["tenant-server.js"], {
        cwd: path.join(__dirname, ".."),
        env: {
          ...process.env,
          TENANT_PORT: newRestaurant.puerto,
          TENANT_ID: newRestaurant.id,
          TENANT_SUBDOMAIN: newRestaurant.subdominio,
          TENANT_NAME: newRestaurant.nombre,
        },
        stdio: ["pipe", "pipe", "pipe"],
      });

      child.stdout.on("data", (data) => {
        console.log(`[${newRestaurant.nombre}:${newRestaurant.puerto}] ${data.toString().trim()}`);
      });

      child.stderr.on("data", (data) => {
        console.error(`[${newRestaurant.nombre}:${newRestaurant.puerto}] ERROR: ${data.toString().trim()}`);
      });

      child.on("close", (code) => {
        console.log(`[${newRestaurant.nombre}:${newRestaurant.puerto}] Proceso terminado con código ${code}`);
      });

      // Esperar un poco para que el servidor se inicie
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (startError) {
      console.error("Error iniciando instancia del tenant:", startError);
      // Continuar de todas formas, el master-server puede iniciarlo después
    }

    await connection.end();

    // Generar token JWT
    const token = jwt.sign(
      {
        id: newRestaurant.id,
        email: newRestaurant.email,
        nombre: newRestaurant.nombre,
        rol: "admin",
        restaurant_id: newRestaurant.id,
        puerto: newRestaurant.puerto,
        subdominio: newRestaurant.subdominio,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Enviar respuesta sin password
    const userResponse = {
      id: newRestaurant.id,
      nombre: newRestaurant.nombre,
      email: newRestaurant.email,
      telefono: newRestaurant.telefono,
      direccion: newRestaurant.direccion,
      puerto: newRestaurant.puerto,
      subdominio: newRestaurant.subdominio,
      activo: newRestaurant.activo,
      rol: "admin",
      restaurant_id: newRestaurant.id,
    };

    res.status(201).json({
      message: "Restaurante registrado exitosamente",
      user: userResponse,
      token: token,
    });
  } catch (error) {
    console.error("Error en registro:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ 
      error: error.message || "Error interno del servidor",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 3. Obtener sucursales (branches) de un restaurante
router.get("/branches/:restaurantId", async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const connection = await connectDB();

    const [branches] = await connection.execute(
      "SELECT * FROM branches WHERE restaurant_id = ?",
      [restaurantId]
    );

    await connection.end();
    res.json(branches);
  } catch (error) {
    console.error("Error obteniendo sucursales:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// 4. Obtener todos los restaurantes (para selector)
router.get("/restaurants", async (req, res) => {
  try {
    const connection = await connectDB();

    const [restaurants] = await connection.execute(
      "SELECT id, nombre, email, telefono, direccion, puerto, subdominio, activo FROM restaurants WHERE activo = true"
    );

    await connection.end();
    res.json(restaurants);
  } catch (error) {
    console.error("Error obteniendo restaurantes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// 5. Verificar token
router.get("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const connection = await connectDB();

    const [users] = await connection.execute(
      "SELECT * FROM restaurants WHERE id = ? AND activo = true",
      [decoded.id]
    );

    await connection.end();

    if (users.length === 0) {
      return res
        .status(401)
        .json({ error: "Usuario no encontrado o inactivo" });
    }

    const user = users[0];
    const userResponse = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono,
      direccion: user.direccion,
      puerto: user.puerto,
      subdominio: user.subdominio,
      activo: user.activo,
      rol: "admin",
      restaurant_id: user.id,
    };

    res.json({ user: userResponse });
  } catch (error) {
    console.error("Error verificando token:", error);
    res.status(401).json({ error: "Token inválido" });
  }
});

module.exports = router;