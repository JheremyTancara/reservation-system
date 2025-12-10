const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = process.env.TENANT_PORT || 3001;
const TENANT_ID = process.env.TENANT_ID;
const TENANT_SUBDOMAIN = process.env.TENANT_SUBDOMAIN;
const TENANT_NAME = process.env.TENANT_NAME;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../../frontend/frontend/dist")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || "3306",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "AlejandraVargas12",
  database: process.env.DB_NAME || "chatbot_reservas",
};

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "tu_secreto_jwt_super_seguro";

// Función para conectar a la base de datos
const MESA_ESTADOS = [
  "disponible",
  "reservada",
  "ocupada",
  "espera",
  "sin_servicio",
];

const normalizarEstadoMesa = (estado) => {
  if (!estado) return "disponible";
  const estadoMin = String(estado).toLowerCase();
  return MESA_ESTADOS.includes(estadoMin) ? estadoMin : "disponible";
};

async function obtenerBranchPrincipal(connection) {
  const [branches] = await connection.execute(
    "SELECT id FROM branches WHERE restaurant_id = ? LIMIT 1",
    [TENANT_ID]
  );

  if (branches.length === 0) {
    throw new Error("No hay sucursales configuradas. Crea una antes de gestionar mesas.");
  }

  return branches[0].id;
}

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

// Middleware para verificar token - VERSIÓN ESTRICTA POR PUERTO
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    // Verificar que el token es válido
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Obtener puerto del token y del servidor
    const tokenPuerto = decoded.puerto;
    const serverPuerto = PORT;
    
    // Obtener IDs para logging
    const tokenRestaurantId = decoded.restaurant_id || decoded.id;
    const tenantId = TENANT_ID;
    
    console.log("🔍 Verificando token:", {
      ruta: req.path,
      token_puerto: tokenPuerto,
      server_puerto: serverPuerto,
      token_restaurant_id: tokenRestaurantId,
      tenant_id: tenantId
    });
    
    // VERIFICACIÓN ESTRICTA: El puerto del token DEBE coincidir exactamente con el puerto del servidor
    if (!tokenPuerto || String(tokenPuerto) !== String(serverPuerto)) {
      console.error("❌ Acceso denegado: Puerto del token no coincide con el puerto del servidor", {
        token_puerto: tokenPuerto,
        server_puerto: serverPuerto,
        token_restaurant_id: tokenRestaurantId,
        ruta: req.path
      });
      return res.status(401).json({ 
        error: "No autorizado. Por favor inicia sesión nuevamente."
      });
    }
    
    // Si el puerto coincide, verificar también el ID del restaurante (doble verificación)
    if (tenantId && tokenRestaurantId && String(tokenRestaurantId) !== String(tenantId)) {
      console.warn("⚠️ Advertencia: Puerto coincide pero ID no coincide", {
        token_restaurant_id: tokenRestaurantId,
        tenant_id: tenantId
      });
      // Aún así permitir acceso si el puerto coincide (el puerto es más confiable)
    }
    
    // Si llegamos aquí, el puerto coincide, permitir acceso
    console.log("✅ Token verificado correctamente - Puerto coincide");
    req.user = decoded;
    next();
  } catch (error) {
    console.error("❌ Error verificando token:", error.message);
    res.status(401).json({ error: "Token inválido", details: error.message });
  }
};

// Ruta de prueba del tenant
app.get("/", (req, res) => {
  res.json({
    message: `Servidor Tenant - ${TENANT_NAME}`,
    tenant_id: TENANT_ID,
    subdomain: TENANT_SUBDOMAIN,
    port: PORT,
    status: "Activo",
  });
});

// Ruta de login para el tenant
app.post("/api/auth/login", async (req, res) => {
  let connection;
  try {
    const { emailOrName, password } = req.body;

    if (!emailOrName || !password) {
      return res.status(400).json({ error: "Email y password son requeridos" });
    }

    connection = await connectDB();

    // Buscar restaurante por email o nombre
    const [users] = await connection.execute(
      "SELECT * FROM restaurants WHERE (LOWER(email) = LOWER(?) OR LOWER(nombre) = LOWER(?)) AND activo = true AND id = ?",
      [emailOrName, emailOrName, TENANT_ID]
    );

    if (users.length === 0) {
      await connection.end();
      return res.status(401).json({ 
        error: "Credenciales inválidas" 
      });
    }

    const user = users[0];

    // Verificar password (texto plano o bcrypt)
    let passwordMatch = false;
    if (user.password) {
      // Intentar comparar como texto plano primero
      if (password === user.password) {
        passwordMatch = true;
      } else {
        // Si no coincide, intentar con bcrypt
        try {
          const bcrypt = require("bcrypt");
          passwordMatch = await bcrypt.compare(password, user.password);
        } catch (e) {
          // Si bcrypt falla, asumir que no coincide
          passwordMatch = false;
        }
      }
    }

    if (!passwordMatch) {
      await connection.end();
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Generar token JWT con el puerto del tenant
    const token = jwt.sign(
      {
        id: user.id,
        restaurant_id: user.id,
        puerto: PORT,
        nombre: user.nombre,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

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

    await connection.end();

    console.log(`✅ Login exitoso en tenant ${PORT}: ${user.nombre}`);
    res.json({
      message: "Login exitoso",
      user: userResponse,
      token: token,
    });
  } catch (error) {
    console.error("❌ Error en login del tenant:", error);
    if (connection) await connection.end();
    res.status(500).json({ 
      error: error.message || "Error interno del servidor"
    });
  }
});

// Ruta de verificación de token
app.get("/api/auth/verify", async (req, res) => {
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

// Dashboard - Estadísticas del restaurante
app.get(
  "/api/dashboard/estadisticas/:restaurantId",
  verifyToken,
  async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const connection = await connectDB();

      // Verificar que el restaurantId coincide con el tenant
      if (restaurantId != TENANT_ID) {
        await connection.end();
        return res.status(403).json({ error: "Acceso denegado" });
      }

      // Obtener total de reservas
      const [reservasResult] = await connection.execute(
        "SELECT COUNT(*) as total FROM reservas WHERE restaurant_id = ?",
        [restaurantId]
      );

      // Obtener total de mesas
      const [mesasResult] = await connection.execute(
        "SELECT COUNT(*) as total FROM mesas WHERE restaurant_id = ?",
        [restaurantId]
      );

      // Obtener total de platos
      const [platosResult] = await connection.execute(
        "SELECT COUNT(*) as total FROM menu_items WHERE restaurant_id = ?",
        [restaurantId]
      );

      await connection.end();

      const estadisticas = {
        total_reservas: reservasResult[0].total,
        total_mesas: mesasResult[0].total,
        total_platos: platosResult[0].total,
      };

      res.json(estadisticas);
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

// Obtener sucursales del restaurante (PÚBLICO)
app.get("/api/branches", async (req, res) => {
  try {
    const connection = await connectDB();
    const [branches] = await connection.execute(
      "SELECT * FROM branches WHERE restaurant_id = ?",
      [TENANT_ID]
    );
    await connection.end();
    res.json(branches);
  } catch (error) {
    console.error("Error obteniendo sucursales:", error);
    res.status(500).json({ error: "Error interno del servidor", details: error.message });
  }
});

// Crear una nueva sucursal
app.post("/api/branches", verifyToken, async (req, res) => {
  try {
    const { nombre, email, telefono, direccion } = req.body;

    if (!nombre || !email) {
      return res
        .status(400)
        .json({ error: "El nombre y el email de la sucursal son obligatorios" });
    }

    const connection = await connectDB();

    const [existing] = await connection.execute(
      "SELECT id FROM branches WHERE restaurant_id = ? AND email = ?",
      [TENANT_ID, email]
    );

    if (existing.length > 0) {
      await connection.end();
      return res
        .status(400)
        .json({ error: "Ya existe una sucursal registrada con este email" });
    }

    const [result] = await connection.execute(
      "INSERT INTO branches (nombre, email, telefono, direccion, restaurant_id) VALUES (?, ?, ?, ?, ?)",
      [nombre, email, telefono || null, direccion || null, TENANT_ID]
    );

    await connection.end();
    res.status(201).json({
      id: result.insertId,
      nombre,
      email,
      telefono: telefono || null,
      direccion: direccion || null,
    });
  } catch (error) {
    console.error("Error creando sucursal:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Eliminar una sucursal
app.delete("/api/branches/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await connectDB();

    const [branch] = await connection.execute(
      "SELECT * FROM branches WHERE id = ? AND restaurant_id = ?",
      [id, TENANT_ID]
    );

    if (branch.length === 0) {
      await connection.end();
      return res.status(404).json({ error: "Sucursal no encontrada" });
    }

    const [[mesasCount]] = await connection.execute(
      "SELECT COUNT(*) as total FROM mesas WHERE branch_id = ?",
      [id]
    );
    const [[reservasCount]] = await connection.execute(
      "SELECT COUNT(*) as total FROM reservas WHERE branch_id = ?",
      [id]
    );
    const [[menuCount]] = await connection.execute(
      "SELECT COUNT(*) as total FROM menu_items WHERE branch_id = ?",
      [id]
    );

    if (mesasCount.total > 0 || reservasCount.total > 0 || menuCount.total > 0) {
      await connection.end();
      return res.status(400).json({
        error:
          "No se puede eliminar la sucursal porque tiene mesas, reservas o platos asociados",
      });
    }

    await connection.execute("DELETE FROM branches WHERE id = ?", [id]);
    await connection.end();
    res.json({ message: "Sucursal eliminada correctamente" });
  } catch (error) {
    console.error("Error eliminando sucursal:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Actualizar una sucursal
app.put("/api/branches/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, direccion } = req.body;

    if (!nombre || !email) {
      return res
        .status(400)
        .json({ error: "El nombre y el email de la sucursal son obligatorios" });
    }

    const connection = await connectDB();

    const [branch] = await connection.execute(
      "SELECT * FROM branches WHERE id = ? AND restaurant_id = ?",
      [id, TENANT_ID]
    );

    if (branch.length === 0) {
      await connection.end();
      return res.status(404).json({ error: "Sucursal no encontrada" });
    }

    const [emailUsed] = await connection.execute(
      "SELECT id FROM branches WHERE restaurant_id = ? AND email = ? AND id != ?",
      [TENANT_ID, email, id]
    );

    if (emailUsed.length > 0) {
      await connection.end();
      return res
        .status(400)
        .json({ error: "El email ya está siendo utilizado por otra sucursal" });
    }

    await connection.execute(
      "UPDATE branches SET nombre = ?, email = ?, telefono = ?, direccion = ? WHERE id = ? AND restaurant_id = ?",
      [nombre, email, telefono || null, direccion || null, id, TENANT_ID]
    );

    await connection.end();
    res.json({ message: "Sucursal actualizada correctamente" });
  } catch (error) {
    console.error("Error actualizando sucursal:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener menú del restaurante (PÚBLICO)
app.get("/api/menu", async (req, res) => {
  try {
    const connection = await connectDB();
    const [menuItems] = await connection.execute(
      `SELECT mi.*, c.nombre as categoria_nombre, b.nombre as branch_nombre 
       FROM menu_items mi 
       LEFT JOIN categorias c ON mi.categoria_id = c.id 
       LEFT JOIN branches b ON mi.branch_id = b.id 
       WHERE mi.restaurant_id = ?`,
      [TENANT_ID]
    );
    await connection.end();
    res.json(menuItems);
  } catch (error) {
    console.error("Error obteniendo menú:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener reservas del restaurante
app.get("/api/reservas", verifyToken, async (req, res) => {
  try {
    const connection = await connectDB();
    
    // Completar reservas vencidas automáticamente
    await completarReservasVencidas(connection);
    
    const [reservas] = await connection.execute(
      `SELECT r.*, b.nombre as branch_nombre, m.numero as mesa_numero 
       FROM reservas r 
       LEFT JOIN branches b ON r.branch_id = b.id 
       LEFT JOIN mesas m ON r.mesa_id = m.id 
       WHERE r.restaurant_id = ? 
       ORDER BY r.created_at DESC`,
      [TENANT_ID]
    );
    await connection.end();
    res.json(reservas);
  } catch (error) {
    console.error("Error obteniendo reservas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Crear reserva pública (sin autenticación)
app.post("/api/reservas/public", async (req, res) => {
  let connection = null;
  try {
    const { cliente_nombre, cliente_telefono, cliente_email, personas, fecha, hora, estado, branch_id, mesa_id, platos, total } = req.body;
    connection = await connectDB();

    await connection.query("START TRANSACTION");

    // Validar mesa y branch
    let finalBranchId = branch_id;
    if (mesa_id) {
      const [mesaData] = await connection.execute(
        "SELECT branch_id FROM mesas WHERE id = ? AND restaurant_id = ?",
        [mesa_id, TENANT_ID]
      );
      if (mesaData.length === 0) {
        await connection.query("ROLLBACK");
        await connection.end();
        return res.status(400).json({ error: "La mesa no existe en este restaurante" });
      }
      finalBranchId = finalBranchId || mesaData[0].branch_id;
    }

    if (!finalBranchId) {
      const [branches] = await connection.execute(
        "SELECT id FROM branches WHERE restaurant_id = ? LIMIT 1",
        [TENANT_ID]
      );
      if (branches.length > 0) {
        finalBranchId = branches[0].id;
      } else {
        await connection.query("ROLLBACK");
        await connection.end();
        return res.status(400).json({ error: "No hay sucursales configuradas" });
      }
    }

    // Insertar la reserva
    const [result] = await connection.execute(
      "INSERT INTO reservas (cliente_nombre, cliente_telefono, cliente_email, personas, fecha, hora, estado, branch_id, restaurant_id, mesa_id, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [cliente_nombre, cliente_telefono || null, cliente_email || null, personas, fecha, hora, estado || "pendiente", finalBranchId, TENANT_ID, mesa_id || null, total || 0]
    );

    const reservaId = result.insertId;

    // Insertar los platos si existen
    if (platos && platos.length > 0) {
      for (const plato of platos) {
        await connection.execute(
          "INSERT INTO reserva_platos (reserva_id, menu_item_id, nombre, precio, branch_id, restaurant_id) VALUES (?, ?, ?, ?, ?, ?)",
          [reservaId, plato.id || null, plato.nombre, plato.precio, finalBranchId, TENANT_ID]
        );
      }
    }

    // Actualizar el estado de la mesa a "ocupada" cuando se crea la reserva pública
    if (mesa_id) {
      await connection.execute('UPDATE mesas SET estado = "ocupada", disponible = 0 WHERE id = ?', [mesa_id]);
    }

    await connection.query("COMMIT");
    await connection.end();
    connection = null;

    res.json({ message: "Reserva creada exitosamente", id: reservaId });
  } catch (error) {
    if (connection) {
      try {
        await connection.query("ROLLBACK");
        await connection.end();
      } catch (rollbackError) {
        console.error("Error en rollback:", rollbackError);
      }
    }
    console.error("Error creando reserva pública:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Crear reserva (con autenticación)
app.post("/api/reservas", verifyToken, async (req, res) => {
  let connection = null;
  try {
    const { cliente_nombre, cliente_telefono, cliente_email, personas, fecha, hora, estado, branch_id, mesa_id, platos, total } = req.body;
    
    // Validaciones básicas
    if (!cliente_nombre || !personas || !fecha || !hora) {
      return res.status(400).json({ error: "Faltan datos requeridos: nombre, personas, fecha y hora son obligatorios" });
    }

    connection = await connectDB();

    await connection.query("START TRANSACTION");

    // Obtener branch_id de la mesa si no se proporciona
    let finalBranchId = branch_id;
    if (!finalBranchId && mesa_id) {
      const [mesaData] = await connection.execute(
        "SELECT branch_id FROM mesas WHERE id = ? AND restaurant_id = ?",
        [mesa_id, TENANT_ID]
      );
      if (mesaData.length === 0) {
        await connection.query("ROLLBACK");
        await connection.end();
        return res.status(400).json({ error: "La mesa no existe en este restaurante" });
      }
      finalBranchId = finalBranchId || mesaData[0].branch_id;
    }

    // Si aún no hay branch_id, obtener la primera sucursal
    if (!finalBranchId) {
      const [branches] = await connection.execute(
        "SELECT id FROM branches WHERE restaurant_id = ? LIMIT 1",
        [TENANT_ID]
      );
      if (branches.length > 0) {
        finalBranchId = branches[0].id;
      } else {
        await connection.query("ROLLBACK");
        await connection.end();
        return res.status(400).json({ error: "No hay sucursales configuradas" });
      }
    }

    // Insertar la reserva
    const [result] = await connection.execute(
      "INSERT INTO reservas (cliente_nombre, cliente_telefono, cliente_email, personas, fecha, hora, estado, branch_id, restaurant_id, mesa_id, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [cliente_nombre, cliente_telefono || null, cliente_email || null, personas, fecha, hora, estado || "pendiente", finalBranchId, TENANT_ID, mesa_id || null, total || 0]
    );

    const reservaId = result.insertId;

    // Insertar los platos si existen
    if (platos && platos.length > 0) {
      for (const plato of platos) {
        await connection.execute(
          "INSERT INTO reserva_platos (reserva_id, menu_item_id, nombre, precio, branch_id, restaurant_id) VALUES (?, ?, ?, ?, ?, ?)",
          [reservaId, plato.id || null, plato.nombre, plato.precio, finalBranchId, TENANT_ID]
        );
      }
    }

    // Actualizar el estado de la mesa a "ocupada" cuando se crea la reserva
    if (mesa_id) {
      await connection.execute('UPDATE mesas SET estado = "ocupada", disponible = 0 WHERE id = ?', [mesa_id]);
    }

    await connection.query("COMMIT");
    await connection.end();
    connection = null;

    res.json({ message: "Reserva creada exitosamente", id: reservaId });
  } catch (error) {
    if (connection) {
      try {
        await connection.query("ROLLBACK");
        await connection.end();
      } catch (rollbackError) {
        console.error("Error en rollback:", rollbackError);
      }
    }
    console.error("Error creando reserva:", error);
    console.error("Detalles del error:", {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      error: "Error interno del servidor",
      details: error.message
    });
  }
});

// Actualizar reserva
app.put("/api/reservas/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { cliente_nombre, personas, fecha, hora, estado, mesa_id, platos, total } = req.body;
    const connection = await connectDB();

    await connection.query("START TRANSACTION");

    // Obtener la reserva anterior para saber qué mesa tenía asignada
    const [reservaAnterior] = await connection.execute(
      "SELECT mesa_id, estado as estado_anterior FROM reservas WHERE id = ? AND restaurant_id = ?",
      [id, TENANT_ID]
    );

    if (reservaAnterior.length === 0) {
      await connection.query("ROLLBACK");
      await connection.end();
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    const mesaAnteriorId = reservaAnterior[0].mesa_id;
    const estadoAnterior = reservaAnterior[0].estado_anterior;

    // Actualizar la reserva
    await connection.execute(
      "UPDATE reservas SET cliente_nombre = ?, personas = ?, fecha = ?, hora = ?, estado = ?, mesa_id = ?, total = ? WHERE id = ? AND restaurant_id = ?",
      [cliente_nombre, personas, fecha, hora, estado, mesa_id || null, total || 0, id, TENANT_ID]
    );

    // Liberar la mesa anterior si cambió de mesa
    if (mesaAnteriorId && mesaAnteriorId !== mesa_id) {
      await connection.execute(
        "UPDATE mesas SET estado = 'disponible', disponible = 1 WHERE id = ?",
        [mesaAnteriorId]
      );
    }

    // Actualizar el estado de la mesa según el estado de la reserva
    if (mesa_id) {
      if (estado === 'confirmada') {
        // Si se confirma, la mesa pasa a ocupada
        await connection.execute(
          "UPDATE mesas SET estado = 'ocupada', disponible = 0 WHERE id = ?",
          [mesa_id]
        );
      } else if (estado === 'cancelada') {
        // Si se cancela, la mesa vuelve a disponible
        await connection.execute(
          "UPDATE mesas SET estado = 'disponible', disponible = 1 WHERE id = ?",
          [mesa_id]
        );
      } else if (estado === 'pendiente') {
        // Si está pendiente, la mesa está reservada
        await connection.execute(
          "UPDATE mesas SET estado = 'reservada', disponible = 0 WHERE id = ?",
          [mesa_id]
        );
      }
    } else if (mesaAnteriorId && !mesa_id) {
      // Si se quita la mesa de la reserva, liberarla
      await connection.execute(
        "UPDATE mesas SET estado = 'disponible', disponible = 1 WHERE id = ?",
        [mesaAnteriorId]
      );
    }

    // Eliminar platos anteriores
    await connection.execute("DELETE FROM reserva_platos WHERE reserva_id = ?", [id]);

    // Insertar nuevos platos
    if (platos && platos.length > 0) {
      const [reserva] = await connection.execute("SELECT branch_id FROM reservas WHERE id = ?", [id]);
      const branchId = reserva[0].branch_id;

      for (const plato of platos) {
        await connection.execute(
          "INSERT INTO reserva_platos (reserva_id, menu_item_id, nombre, precio, branch_id, restaurant_id) VALUES (?, ?, ?, ?, ?, ?)",
          [id, plato.id, plato.nombre, plato.precio, branchId, TENANT_ID]
        );
      }
    }

    await connection.query("COMMIT");
    await connection.end();

    res.json({ message: "Reserva actualizada exitosamente" });
  } catch (error) {
    await connection.query("ROLLBACK");
    console.error("Error actualizando reserva:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Eliminar reserva
app.delete("/api/reservas/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await connectDB();

    await connection.query("START TRANSACTION");

    // Obtener la mesa asociada antes de eliminar
    const [reserva] = await connection.execute(
      "SELECT mesa_id FROM reservas WHERE id = ? AND restaurant_id = ?", 
      [id, TENANT_ID]
    );
    
    // Eliminar platos de la reserva
    await connection.execute("DELETE FROM reserva_platos WHERE reserva_id = ?", [id]);
    
    // Eliminar la reserva
    await connection.execute("DELETE FROM reservas WHERE id = ? AND restaurant_id = ?", [id, TENANT_ID]);

    // Liberar la mesa si existe
    if (reserva.length > 0 && reserva[0].mesa_id) {
      await connection.execute(
        "UPDATE mesas SET estado = 'disponible', disponible = 1 WHERE id = ?", 
        [reserva[0].mesa_id]
      );
    }

    await connection.query("COMMIT");
    await connection.end();
    res.json({ message: "Reserva eliminada exitosamente" });
  } catch (error) {
    await connection.query("ROLLBACK");
    console.error("Error eliminando reserva:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener mesas del restaurante (PÚBLICO)
app.get("/api/mesas", async (req, res) => {
  try {
    const { disponibles } = req.query;
    const connection = await connectDB();
    let query = `SELECT m.*, b.nombre as branch_nombre 
       FROM mesas m 
       LEFT JOIN branches b ON m.branch_id = b.id 
       WHERE m.restaurant_id = ?`;
    
    const params = [TENANT_ID];
    
    // Si se solicita solo disponibles, filtrar por estado
    if (disponibles === 'true') {
      query += ` AND m.estado = 'disponible'`;
    }
    
    const [mesas] = await connection.execute(query, params);
    await connection.end();
    res.json(mesas);
  } catch (error) {
    console.error("Error obteniendo mesas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Crear una mesa específica
app.post("/api/mesas", verifyToken, async (req, res) => {
  try {
    const { numero, capacidad, estado, descripcion } = req.body;

    if (!numero || Number(numero) <= 0) {
      return res.status(400).json({ error: "El número de mesa es requerido" });
    }
    if (!capacidad || Number(capacidad) <= 0) {
      return res.status(400).json({ error: "La capacidad debe ser mayor a 0" });
    }

    const connection = await connectDB();
    const branchId = await obtenerBranchPrincipal(connection);

    const [existeNumero] = await connection.execute(
      "SELECT id FROM mesas WHERE restaurant_id = ? AND branch_id = ? AND numero = ?",
      [TENANT_ID, branchId, numero]
    );

    if (existeNumero.length > 0) {
      await connection.end();
      return res.status(400).json({ error: "Ya existe una mesa con ese número en esta sucursal" });
    }

    const estadoFinal = normalizarEstadoMesa(estado);
    const descripcionFinal =
      typeof descripcion === "string" && descripcion.trim().length > 0
        ? descripcion.trim().slice(0, 255)
        : null;
    await connection.execute(
      "INSERT INTO mesas (numero, capacidad, estado, disponible, branch_id, restaurant_id, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [numero, capacidad, estadoFinal, estadoFinal === "disponible" ? 1 : 0, branchId, TENANT_ID, descripcionFinal]
    );

    const [nuevaMesa] = await connection.execute(
      `SELECT m.*, b.nombre as branch_nombre 
       FROM mesas m 
       LEFT JOIN branches b ON m.branch_id = b.id 
       WHERE m.restaurant_id = ? AND m.numero = ? 
       ORDER BY m.id DESC 
       LIMIT 1`,
      [TENANT_ID, numero]
    );

    await connection.end();
    res.status(201).json(nuevaMesa[0]);
  } catch (error) {
    console.error("Error creando mesa:", error);
    const statusCode = error.message?.includes("sucursales") ? 400 : 500;
    res.status(statusCode).json({ error: error.message || "Error interno del servidor" });
  }
});

// Actualizar mesa
app.put("/api/mesas/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, capacidad, estado, descripcion } = req.body;

    if (!numero || Number(numero) <= 0) {
      return res.status(400).json({ error: "El número de mesa es requerido" });
    }
    if (!capacidad || Number(capacidad) <= 0) {
      return res.status(400).json({ error: "La capacidad debe ser mayor a 0" });
    }

    const connection = await connectDB();

    const [mesaActual] = await connection.execute(
      "SELECT * FROM mesas WHERE id = ? AND restaurant_id = ?",
      [id, TENANT_ID]
    );

    if (mesaActual.length === 0) {
      await connection.end();
      return res.status(404).json({ error: "Mesa no encontrada" });
    }

    // Obtener branch_id de la mesa actual
    const mesaBranchId = mesaActual[0].branch_id;
    
    const [numeroEnUso] = await connection.execute(
      "SELECT id FROM mesas WHERE restaurant_id = ? AND branch_id = ? AND numero = ? AND id != ?",
      [TENANT_ID, mesaBranchId, numero, id]
    );

    if (numeroEnUso.length > 0) {
      await connection.end();
      return res.status(400).json({ error: "Ese número ya está asignado a otra mesa en esta sucursal" });
    }

    const estadoFinal = normalizarEstadoMesa(estado);
    const descripcionFinal =
      typeof descripcion === "string" && descripcion.trim().length > 0
        ? descripcion.trim().slice(0, 255)
        : null;

    await connection.execute(
      "UPDATE mesas SET numero = ?, capacidad = ?, estado = ?, disponible = ?, descripcion = ? WHERE id = ? AND restaurant_id = ?",
      [numero, capacidad, estadoFinal, estadoFinal === "disponible" ? 1 : 0, descripcionFinal, id, TENANT_ID]
    );

    const [mesaActualizada] = await connection.execute(
      `SELECT m.*, b.nombre as branch_nombre 
       FROM mesas m 
       LEFT JOIN branches b ON m.branch_id = b.id 
       WHERE m.id = ?`,
      [id]
    );

    await connection.end();
    res.json(mesaActualizada[0]);
  } catch (error) {
    console.error("Error actualizando mesa:", error);
    const statusCode = error.message?.includes("sucursales") ? 400 : 500;
    res.status(statusCode).json({ error: error.message || "Error interno del servidor" });
  }
});

// Eliminar mesa
app.delete("/api/mesas/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await connectDB();

    const [mesa] = await connection.execute(
      "SELECT * FROM mesas WHERE id = ? AND restaurant_id = ?",
      [id, TENANT_ID]
    );

    if (mesa.length === 0) {
      await connection.end();
      return res.status(404).json({ error: "Mesa no encontrada" });
    }

    const [reservasActivas] = await connection.execute(
      `SELECT COUNT(*) as total 
       FROM reservas 
       WHERE mesa_id = ? 
       AND restaurant_id = ? 
       AND estado NOT IN ('cancelada', 'finalizada')`,
      [id, TENANT_ID]
    );

    if (reservasActivas[0].total > 0) {
      await connection.end();
      return res.status(400).json({
        error: "No se puede eliminar la mesa porque tiene reservas activas",
      });
    }

    await connection.execute("DELETE FROM mesas WHERE id = ?", [id]);
    await connection.end();
    res.json({ message: "Mesa eliminada correctamente" });
  } catch (error) {
    console.error("Error eliminando mesa:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Actualizar información del restaurante (solo nombre, email, teléfono, dirección)
app.put("/api/restaurant/info", verifyToken, async (req, res) => {
  try {
    const { nombre, email, telefono, direccion } = req.body;
    const connection = await connectDB();

    await connection.execute(
      "UPDATE restaurants SET nombre = ?, email = ?, telefono = ?, direccion = ? WHERE id = ?",
      [nombre, email, telefono || null, direccion || null, TENANT_ID]
    );

    // Obtener el restaurante actualizado
    const [restaurants] = await connection.execute(
      "SELECT id, nombre, email, telefono, direccion, puerto, subdominio, activo FROM restaurants WHERE id = ?",
      [TENANT_ID]
    );

    await connection.end();

    res.json({
      message: "Información actualizada exitosamente",
      restaurant: restaurants[0],
    });
  } catch (error) {
    console.error("Error actualizando información:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener información del restaurante
app.get("/api/restaurant/info", verifyToken, async (req, res) => {
  try {
    const connection = await connectDB();
    const [restaurants] = await connection.execute(
      "SELECT id, nombre, email, telefono, direccion, puerto, subdominio, activo, logo_path, cover_path FROM restaurants WHERE id = ?",
      [TENANT_ID]
    );
    await connection.end();

    if (restaurants.length === 0) {
      return res.status(404).json({ error: "Restaurante no encontrado" });
    }

    const restaurant = restaurants[0];
    
    // Construir URLs completas para las imágenes
    if (restaurant.logo_path) {
      restaurant.logo_url = `http://localhost:${PORT}${restaurant.logo_path}`;
    }
    if (restaurant.cover_path) {
      restaurant.cover_url = `http://localhost:${PORT}${restaurant.cover_path}`;
    }

    res.json(restaurant);
  } catch (error) {
    console.error("Error obteniendo información:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Función para completar reservas automáticamente después de la hora
async function completarReservasVencidas(connection) {
  try {
    const ahora = new Date();
    const fechaActual = ahora.toISOString().split('T')[0];
    const horaActual = ahora.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
    
    // Obtener reservas pendientes o confirmadas que ya pasaron su hora
    const [reservasVencidas] = await connection.execute(
      `SELECT id, mesa_id, fecha, hora 
       FROM reservas 
       WHERE restaurant_id = ? 
       AND estado IN ('pendiente', 'confirmada')
       AND (
         (fecha < ?) OR 
         (fecha = ? AND hora < ?)
       )`,
      [TENANT_ID, fechaActual, fechaActual, horaActual]
    );

    // Completar cada reserva vencida
    for (const reserva of reservasVencidas) {
      await connection.execute(
        "UPDATE reservas SET estado = 'confirmada' WHERE id = ?",
        [reserva.id]
      );
      
      // Liberar la mesa si estaba reservada
      if (reserva.mesa_id) {
        await connection.execute(
          "UPDATE mesas SET estado = 'disponible', disponible = 1 WHERE id = ?",
          [reserva.mesa_id]
        );
      }
    }

    return reservasVencidas.length;
  } catch (error) {
    console.error("Error completando reservas vencidas:", error);
    return 0;
  }
}

// Obtener reservas con platos
app.get("/api/reservas/complete", verifyToken, async (req, res) => {
  try {
    const connection = await connectDB();
    
    // Completar reservas vencidas automáticamente
    await completarReservasVencidas(connection);
    
    // Obtener reservas
    const [reservas] = await connection.execute(
      `SELECT r.*, b.nombre as branch_nombre, m.numero as mesa_numero 
       FROM reservas r 
       LEFT JOIN branches b ON r.branch_id = b.id 
       LEFT JOIN mesas m ON r.mesa_id = m.id 
       WHERE r.restaurant_id = ? 
       ORDER BY r.fecha DESC, r.hora DESC`,
      [TENANT_ID]
    );

    // Para cada reserva, obtener sus platos
    for (let reserva of reservas) {
      const [platos] = await connection.execute(
        "SELECT * FROM reserva_platos WHERE reserva_id = ?",
        [reserva.id]
      );
      reserva.platos = platos;
    }

    await connection.end();
    res.json(reservas);
  } catch (error) {
    console.error("Error obteniendo reservas completas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Gestionar mesas - Crear/Actualizar número de mesas
app.post("/api/mesas/configure", verifyToken, async (req, res) => {
  try {
    const { cantidad } = req.body;
    const connection = await connectDB();

    // Obtener mesas actuales
    const [mesasActuales] = await connection.execute(
      "SELECT COUNT(*) as total FROM mesas WHERE restaurant_id = ?",
      [TENANT_ID]
    );

    const totalActual = mesasActuales[0].total;
    const cantidadNueva = parseInt(cantidad) || 0;

    if (cantidadNueva < 0) {
      await connection.end();
      return res.status(400).json({ error: "La cantidad debe ser mayor o igual a 0" });
    }

    // Obtener la primera sucursal del restaurante
    const [branches] = await connection.execute(
      "SELECT id FROM branches WHERE restaurant_id = ? LIMIT 1",
      [TENANT_ID]
    );

    if (branches.length === 0) {
      await connection.end();
      return res.status(400).json({ error: "No hay sucursales configuradas" });
    }

    const branchId = branches[0].id;

    if (cantidadNueva > totalActual) {
      // Crear nuevas mesas
      const mesasACrear = cantidadNueva - totalActual;
      for (let i = totalActual + 1; i <= cantidadNueva; i++) {
        await connection.execute(
          "INSERT INTO mesas (numero, capacidad, disponible, branch_id, restaurant_id, estado, descripcion) VALUES (?, ?, 1, ?, ?, 'disponible', ?)",
          [i, 4, branchId, TENANT_ID, null] // Capacidad por defecto: 4
        );
      }
    } else if (cantidadNueva < totalActual) {
      // Eliminar mesas (solo las que no tienen reservas activas)
      const [mesasAEliminar] = await connection.execute(
        `SELECT m.id FROM mesas m 
         LEFT JOIN reservas r ON m.id = r.mesa_id AND r.estado != 'cancelada'
         WHERE m.restaurant_id = ? AND r.id IS NULL
         ORDER BY m.numero DESC
         LIMIT ?`,
        [TENANT_ID, totalActual - cantidadNueva]
      );

      for (let mesa of mesasAEliminar) {
        await connection.execute("DELETE FROM mesas WHERE id = ?", [mesa.id]);
      }
    }

    // Obtener el nuevo total
    const [nuevoTotal] = await connection.execute(
      "SELECT COUNT(*) as total FROM mesas WHERE restaurant_id = ?",
      [TENANT_ID]
    );

    await connection.end();

    res.json({
      message: "Mesas configuradas exitosamente",
      total: nuevoTotal[0].total,
    });
  } catch (error) {
    console.error("Error configurando mesas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Entrenar bot con contexto
app.post("/api/bot/train", verifyToken, async (req, res) => {
  try {
    const { contexto, telefono, menuEntrenamiento } = req.body;
    
    // Guardar en archivo JSON en lugar de DB
    const configPath = path.join(__dirname, `../chatbot-configs/restaurant_${TENANT_ID}.json`);
    
    const botConfig = {
      contexto: contexto || "",
      telefono: telefono || "",
      menuEntrenamiento: Array.isArray(menuEntrenamiento) ? menuEntrenamiento : []
    };
    
    // Crear directorio si no existe
    const configDir = path.join(__dirname, '../chatbot-configs');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Guardar configuración en JSON
    fs.writeFileSync(configPath, JSON.stringify(botConfig, null, 2), 'utf8');

    res.json({
      message: "Bot entrenado exitosamente",
    });
  } catch (error) {
    console.error("Error entrenando bot:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener contexto de entrenamiento del bot
app.get("/api/bot/context", verifyToken, async (req, res) => {
  try {
    // Leer configuración desde archivo JSON en lugar de DB
    const configPath = path.join(__dirname, `../chatbot-configs/restaurant_${TENANT_ID}.json`);
    
    let botConfig = {
      contexto: "",
      telefono: "",
      menuEntrenamiento: []
    };
    
    // Intentar leer el archivo si existe
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf8');
      botConfig = JSON.parse(fileContent);
    } else {
      // Si no existe, crear uno por defecto
      const defaultConfig = {
        contexto: `Bienvenido a ${TENANT_NAME}. Somos un restaurante que ofrece los mejores platos.`,
        telefono: "",
        menuEntrenamiento: []
      };
      
      // Crear directorio si no existe
      const configDir = path.join(__dirname, '../chatbot-configs');
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      // Guardar configuración por defecto
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
      botConfig = defaultConfig;
    }

    res.json(botConfig);
  } catch (error) {
    console.error("Error obteniendo contexto:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Endpoint para chat conversacional simple
app.post("/api/chat", async (req, res) => {
  try {
    // Aceptar formato del frontend (message) o de WhatsApp (text)
    const userMessage = req.body.message || req.body.text;
    const fromNumber = req.body.number; // Para WhatsApp
    
    if (!userMessage || !userMessage.trim()) {
      return res.status(400).json({ error: "El mensaje no puede estar vacío" });
    }

    console.log(`📩 Mensaje recibido${fromNumber ? ` de ${fromNumber}` : ''}: ${userMessage}`);

    // Leer configuración del bot
    const configPath = path.join(__dirname, `../chatbot-configs/restaurant_${TENANT_ID}.json`);
    
    let botConfig = {
      contexto: `Bienvenido a ${TENANT_NAME}. ¿En qué puedo ayudarte?`,
      telefono: "",
      menuEntrenamiento: []
    };
    
    // Cargar configuración si existe
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf8');
      botConfig = JSON.parse(fileContent);
    }

    // Normalizar mensaje del usuario
    const normalizedMessage = userMessage.toLowerCase().trim();
    
    // Respuestas basadas en el contexto y menú entrenado
    let response = "";
    
    // Saludos
    if (normalizedMessage.match(/^(hola|buenos dias|buenas tardes|buenas noches|hey|hi)/)) {
      response = `¡Hola! ${botConfig.contexto || `Bienvenido a ${TENANT_NAME}`}\n\n¿En qué puedo ayudarte hoy?`;
    }
    // Consulta de menú/platos
    else if (normalizedMessage.includes("menu") || normalizedMessage.includes("platos") || normalizedMessage.includes("comida") || normalizedMessage.includes("que tienen")) {
      if (botConfig.menuEntrenamiento && botConfig.menuEntrenamiento.length > 0) {
        response = "📋 Estos son nuestros platos disponibles:\n\n";
        botConfig.menuEntrenamiento.forEach((plato, index) => {
          response += `${index + 1}. ${plato.nombre} - Bs. ${plato.precio}\n`;
          if (plato.descripcion) {
            response += `   ${plato.descripcion}\n`;
          }
        });
        response += "\n¿Te gustaría saber más sobre algún plato en particular?";
      } else {
        response = "En este momento estamos actualizando nuestro menú. Por favor contáctanos para conocer nuestros platos disponibles.";
        if (botConfig.telefono) {
          response += `\n\nTeléfono: ${botConfig.telefono}`;
        }
      }
    }
    // Consulta de precios
    else if (normalizedMessage.includes("precio") || normalizedMessage.includes("costo") || normalizedMessage.includes("cuanto cuesta")) {
      if (botConfig.menuEntrenamiento && botConfig.menuEntrenamiento.length > 0) {
        response = "💰 Precios de nuestros platos:\n\n";
        botConfig.menuEntrenamiento.forEach((plato) => {
          response += `• ${plato.nombre}: Bs. ${plato.precio}\n`;
        });
      } else {
        response = "Para información sobre precios, por favor contáctanos directamente.";
        if (botConfig.telefono) {
          response += `\n\nTeléfono: ${botConfig.telefono}`;
        }
      }
    }
    // Consulta de contacto/teléfono
    else if (normalizedMessage.includes("telefono") || normalizedMessage.includes("contacto") || normalizedMessage.includes("llamar")) {
      if (botConfig.telefono) {
        response = `📞 Puedes contactarnos al: ${botConfig.telefono}\n\n¿Hay algo más en lo que pueda ayudarte?`;
      } else {
        response = "En este momento no tengo un número de contacto disponible. Por favor visítanos directamente.";
      }
    }
    // Horarios
    else if (normalizedMessage.includes("horario") || normalizedMessage.includes("abierto") || normalizedMessage.includes("abren") || normalizedMessage.includes("cierran")) {
      response = "Nuestros horarios de atención varían según la sucursal. Por favor contáctanos para conocer los horarios específicos.";
      if (botConfig.telefono) {
        response += `\n\nTeléfono: ${botConfig.telefono}`;
      }
    }
    // Despedidas
    else if (normalizedMessage.match(/^(adios|chao|hasta luego|bye|gracias)/)) {
      response = `¡Gracias por contactarnos! Fue un placer atenderte. ¡Hasta pronto! 👋`;
    }
    // Búsqueda de plato específico
    else {
      // Intentar buscar si menciona algún plato del menú
      const platoEncontrado = botConfig.menuEntrenamiento.find(plato => 
        normalizedMessage.includes(plato.nombre.toLowerCase())
      );
      
      if (platoEncontrado) {
        response = `🍽️ ${platoEncontrado.nombre}\n`;
        response += `Precio: Bs. ${platoEncontrado.precio}\n`;
        if (platoEncontrado.descripcion) {
          response += `\n${platoEncontrado.descripcion}\n`;
        }
        response += "\n¿Te gustaría ordenar este plato o saber más sobre otros?";
      } else {
        // Respuesta por defecto
        response = `${botConfig.contexto}\n\nPuedo ayudarte con:\n`;
        response += "• Ver el menú y precios\n";
        response += "• Información de contacto\n";
        response += "• Horarios de atención\n\n";
        response += "¿Qué te gustaría saber?";
      }
    }

    console.log(`📤 Respuesta enviada: ${response.substring(0, 100)}...`);
    res.json({ response });

  } catch (error) {
    console.error("❌ Error en chat:", error);
    res.status(500).json({ 
      error: "Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo.",
      response: "Disculpa, tuve un problema técnico. Por favor intenta nuevamente." 
    });
  }
});

// Obtener categorías del restaurante
app.get("/api/categorias", async (req, res) => {
  try {
    const connection = await connectDB();
    const [categorias] = await connection.execute(
      "SELECT * FROM categorias WHERE restaurant_id = ?",
      [TENANT_ID]
    );
    await connection.end();
    res.json(categorias);
  } catch (error) {
    console.error("Error obteniendo categorías:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Crear categoría
app.post("/api/categorias", verifyToken, async (req, res) => {
  try {
    const { nombre } = req.body;
    const connection = await connectDB();
    
    const [result] = await connection.execute(
      "INSERT INTO categorias (nombre, restaurant_id) VALUES (?, ?)",
      [nombre, TENANT_ID]
    );
    
    await connection.end();
    res.json({ message: "Categoría creada exitosamente", id: result.insertId });
  } catch (error) {
    console.error("Error creando categoría:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Eliminar categoría
app.delete("/api/categorias/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await connectDB();
    
    // Verificar que la categoría pertenece al restaurante
    const [categorias] = await connection.execute(
      "SELECT * FROM categorias WHERE id = ? AND restaurant_id = ?",
      [id, TENANT_ID]
    );
    
    if (categorias.length === 0) {
      await connection.end();
      return res.status(404).json({ error: "Categoría no encontrada" });
    }
    
    // Verificar si hay platos usando esta categoría
    const [platos] = await connection.execute(
      "SELECT COUNT(*) as count FROM menu_items WHERE categoria_id = ?",
      [id]
    );
    
    if (platos[0].count > 0) {
      await connection.end();
      return res.status(400).json({ 
        error: "No se puede eliminar la categoría porque tiene platos asociados" 
      });
    }
    
    // Eliminar la categoría
    await connection.execute(
      "DELETE FROM categorias WHERE id = ? AND restaurant_id = ?",
      [id, TENANT_ID]
    );
    
    await connection.end();
    res.json({ message: "Categoría eliminada exitosamente" });
  } catch (error) {
    console.error("Error eliminando categoría:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Crear/Actualizar plato del menú
app.post("/api/menu", verifyToken, async (req, res) => {
  try {
    const { nombre, descripcion, precio, imagen_url, categoria_id, branch_id } = req.body;
    const connection = await connectDB();
    
    // Obtener la primera sucursal si no se proporciona
    let finalBranchId = branch_id;
    if (!finalBranchId) {
      const [branches] = await connection.execute(
        "SELECT id FROM branches WHERE restaurant_id = ? LIMIT 1",
        [TENANT_ID]
      );
      if (branches.length > 0) {
        finalBranchId = branches[0].id;
      } else {
        await connection.end();
        return res.status(400).json({ error: "No hay sucursales configuradas" });
      }
    }
    
    const [result] = await connection.execute(
      "INSERT INTO menu_items (nombre, descripcion, precio, imagen_url, categoria_id, branch_id, restaurant_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [nombre, descripcion, precio, imagen_url || null, categoria_id || null, finalBranchId, TENANT_ID]
    );
    
    await connection.end();
    res.json({ message: "Plato creado exitosamente", id: result.insertId });
  } catch (error) {
    console.error("Error creando plato:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Actualizar plato del menú
app.put("/api/menu/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, imagen_url, categoria_id, branch_id } = req.body;
    const connection = await connectDB();
    
    await connection.execute(
      "UPDATE menu_items SET nombre = ?, descripcion = ?, precio = ?, imagen_url = ?, categoria_id = ?, branch_id = ? WHERE id = ? AND restaurant_id = ?",
      [nombre, descripcion, precio, imagen_url || null, categoria_id || null, branch_id, id, TENANT_ID]
    );
    
    await connection.end();
    res.json({ message: "Plato actualizado exitosamente" });
  } catch (error) {
    console.error("Error actualizando plato:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Eliminar plato del menú
app.delete("/api/menu/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await connectDB();
    
    await connection.execute(
      "DELETE FROM menu_items WHERE id = ? AND restaurant_id = ?",
      [id, TENANT_ID]
    );
    
    await connection.end();
    res.json({ message: "Plato eliminado exitosamente" });
  } catch (error) {
    console.error("Error eliminando plato:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Upload de imágenes
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

app.post("/api/upload", verifyToken, upload.single("imagen"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó ninguna imagen" });
    }
    
    const port = PORT;
    const url = `http://localhost:${port}/uploads/${req.file.filename}`;
    res.json({ url });
  } catch (error) {
    console.error("Error subiendo imagen:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ruta para /chat que sirve el frontend React
app.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/frontend/dist/index.html"));
});

// Servir el front_cliente en /chat-client
app.use(
  "/chat-client",
  express.static(path.join(__dirname, "chat-client-dist"))
);

// Para que funcione el routing de React en /chat-client
app.get("/chat-client/*", (req, res) => {
  res.sendFile(path.join(__dirname, "chat-client-dist", "index.html"));
});

// Endpoint para info del tenant
app.get("/api/tenant/info", async (req, res) => {
  res.json({
    id: TENANT_ID,
    name: TENANT_NAME,
    subdomain: TENANT_SUBDOMAIN,
    port: PORT,
  });
});

// ==================== ENDPOINTS PARA WHATSAPP BOT ====================

// Obtener información del restaurante para el bot
app.get("/api/whatsapp/restaurant", async (req, res) => {
  try {
    const connection = await connectDB();
    const [restaurants] = await connection.execute(
      "SELECT id, nombre, email, telefono, direccion, logo_url, background_url FROM restaurants WHERE id = ?",
      [TENANT_ID]
    );
    
    if (restaurants.length === 0) {
      await connection.end();
      return res.status(404).json({ error: "Restaurante no encontrado" });
    }

    // Obtener configuración del bot desde archivo JSON
    const configPath = path.join(__dirname, `../chatbot-configs/restaurant_${TENANT_ID}.json`);
    let botConfig = null;
    
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf8');
      botConfig = JSON.parse(fileContent);
    }

    await connection.end();
    
    res.json({
      restaurant: restaurants[0],
      bot: botConfig
    });
  } catch (error) {
    console.error("Error obteniendo información del restaurante:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener menú para el bot
app.get("/api/whatsapp/menu", async (req, res) => {
  try {
    const connection = await connectDB();
    const [menuItems] = await connection.execute(
      `SELECT mi.id, mi.nombre, mi.descripcion, mi.precio, mi.imagen_url, 
              c.nombre as categoria_nombre, b.nombre as branch_nombre 
       FROM menu_items mi 
       LEFT JOIN categorias c ON mi.categoria_id = c.id 
       LEFT JOIN branches b ON mi.branch_id = b.id
       WHERE mi.restaurant_id = ? 
       ORDER BY c.nombre, mi.nombre`,
      [TENANT_ID]
    );
    await connection.end();
    res.json(menuItems);
  } catch (error) {
    console.error("Error obteniendo menú:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener mesas disponibles para una fecha y hora específica
app.get("/api/whatsapp/mesas-disponibles", async (req, res) => {
  try {
    const { fecha, hora, branch_id } = req.query;
    const connection = await connectDB();

    // Obtener todas las mesas del restaurante o de una sucursal específica
    let query = "SELECT * FROM mesas WHERE restaurant_id = ?";
    let params = [TENANT_ID];

    if (branch_id) {
      query += " AND branch_id = ?";
      params.push(branch_id);
    }

    const [mesas] = await connection.execute(query, params);

    // Si se proporciona fecha y hora, filtrar las mesas ocupadas
    if (fecha && hora) {
      const [reservas] = await connection.execute(
        `SELECT mesa_id FROM reservas 
         WHERE restaurant_id = ? 
         AND fecha = ? 
         AND hora = ? 
         AND estado != 'cancelada'`,
        [TENANT_ID, fecha, hora]
      );

      const mesasOcupadas = new Set(reservas.map(r => r.mesa_id));
      const mesasDisponibles = mesas.filter(m => 
        !mesasOcupadas.has(m.id) && m.estado !== 'ocupada'
      );

      await connection.end();
      return res.json(mesasDisponibles);
    }

    // Si no se proporciona fecha/hora, devolver todas las mesas disponibles
    const mesasDisponibles = mesas.filter(m => m.estado === 'disponible' || m.estado === 'reservada');
    await connection.end();
    res.json(mesasDisponibles);
  } catch (error) {
    console.error("Error obteniendo mesas disponibles:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Crear reserva desde WhatsApp
app.post("/api/whatsapp/reservas", async (req, res) => {
  try {
    const { cliente_nombre, cliente_telefono, cliente_email, personas, fecha, hora, branch_id, mesa_id, platos, total } = req.body;
    const connection = await connectDB();

    await connection.query("START TRANSACTION");

    // Obtener branch_id si no se proporciona
    let finalBranchId = branch_id;
    if (!finalBranchId) {
      const [branches] = await connection.execute(
        "SELECT id FROM branches WHERE restaurant_id = ? LIMIT 1",
        [TENANT_ID]
      );
      if (branches.length > 0) {
        finalBranchId = branches[0].id;
      } else {
        await connection.query("ROLLBACK");
        await connection.end();
        return res.status(400).json({ error: "No hay sucursales configuradas" });
      }
    }

    // Insertar la reserva
    const [result] = await connection.execute(
      "INSERT INTO reservas (cliente_nombre, cliente_telefono, cliente_email, personas, fecha, hora, estado, branch_id, restaurant_id, mesa_id, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [cliente_nombre, cliente_telefono || null, cliente_email || null, personas, fecha, hora, "pendiente", finalBranchId, TENANT_ID, mesa_id || null, total || 0]
    );

    const reservaId = result.insertId;

    // Insertar los platos si existen
    if (platos && platos.length > 0) {
      for (const plato of platos) {
        await connection.execute(
          "INSERT INTO reserva_platos (reserva_id, menu_item_id, nombre, precio, branch_id, restaurant_id) VALUES (?, ?, ?, ?, ?, ?)",
          [reservaId, plato.id, plato.nombre, plato.precio, finalBranchId, TENANT_ID]
        );
      }
    }

    // Actualizar el estado de la mesa
    if (mesa_id) {
      await connection.execute('UPDATE mesas SET estado = "reservada" WHERE id = ?', [mesa_id]);
    }

    await connection.query("COMMIT");
    await connection.end();

    res.json({ 
      message: "Reserva creada exitosamente", 
      id: reservaId,
      reserva: {
        id: reservaId,
        cliente_nombre,
        fecha,
        hora,
        personas,
        estado: "pendiente"
      }
    });
  } catch (error) {
    console.error("Error creando reserva desde WhatsApp:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Consultar reservas existentes por teléfono
app.get("/api/whatsapp/reservas", async (req, res) => {
  try {
    const { telefono } = req.query;
    const connection = await connectDB();

    if (!telefono) {
      await connection.end();
      return res.status(400).json({ error: "Teléfono es requerido" });
    }

    const [reservas] = await connection.execute(
      `SELECT r.*, m.numero as mesa_numero, b.nombre as branch_nombre
       FROM reservas r
       LEFT JOIN mesas m ON r.mesa_id = m.id
       LEFT JOIN branches b ON r.branch_id = b.id
       WHERE r.restaurant_id = ? 
       AND r.cliente_telefono = ?
       ORDER BY r.fecha DESC, r.hora DESC
       LIMIT 10`,
      [TENANT_ID, telefono]
    );

    // Obtener platos para cada reserva
    for (const reserva of reservas) {
      const [platos] = await connection.execute(
        "SELECT * FROM reserva_platos WHERE reserva_id = ?",
        [reserva.id]
      );
      reserva.platos = platos;
    }

    await connection.end();
    res.json(reservas);
  } catch (error) {
    console.error("Error consultando reservas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Cancelar reserva desde WhatsApp
app.put("/api/whatsapp/reservas/:id/cancelar", async (req, res) => {
  try {
    const { id } = req.params;
    const { telefono } = req.body;
    const connection = await connectDB();

    // Verificar que la reserva pertenece al teléfono
    const [reservas] = await connection.execute(
      "SELECT * FROM reservas WHERE id = ? AND cliente_telefono = ? AND restaurant_id = ?",
      [id, telefono, TENANT_ID]
    );

    if (reservas.length === 0) {
      await connection.end();
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    // Actualizar estado de la reserva
    await connection.execute(
      "UPDATE reservas SET estado = 'cancelada' WHERE id = ?",
      [id]
    );

    // Liberar la mesa si existe
    if (reservas[0].mesa_id) {
      await connection.execute('UPDATE mesas SET estado = "disponible" WHERE id = ?', [reservas[0].mesa_id]);
    }

    await connection.end();
    res.json({ message: "Reserva cancelada exitosamente" });
  } catch (error) {
    console.error("Error cancelando reserva:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Catch-all para React Router (debe ser '*', no '/*')
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/frontend/dist/index.html"));
});

// Iniciar servidor tenant
app.listen(PORT, () => {
  console.log(`🚀 Servidor Tenant iniciado:`);
  console.log(`   📍 Puerto: ${PORT}`);
  console.log(`   🏪 Restaurante: ${TENANT_NAME}`);
  console.log(`   🆔 ID: ${TENANT_ID}`);
  console.log(`   🌐 Subdominio: ${TENANT_SUBDOMAIN}`);
  console.log(`   🔗 URL: http://localhost:${PORT}`);
});

// Manejo de señales para cerrar limpiamente
process.on("SIGINT", () => {
  console.log(`\n🛑 Cerrando servidor tenant ${TENANT_NAME}...`);
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log(`\n🛑 Cerrando servidor tenant ${TENANT_NAME}...`);
  process.exit(0);
});
