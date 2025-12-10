const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || "3306",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "AlejandraVargas12",
  database: process.env.DB_NAME || "chatbot_reservas",
};

const JWT_SECRET = process.env.JWT_SECRET || "tu_secreto_jwt_super_seguro";

// Configuración de multer para subir fotos de perfil
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/profiles");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `profile-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes (jpeg, jpg, png, gif)"));
    }
  },
});

// Middleware para verificar token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido" });
  }
};

// 📝 REGISTRO DE USUARIO
router.post("/register", async (req, res) => {
  let connection;
  try {
    const { email, password, full_name, phone } = req.body;

    // Validaciones
    if (!email || !password || !full_name) {
      return res.status(400).json({ 
        error: "Email, contraseña y nombre completo son requeridos" 
      });
    }

    connection = await mysql.createConnection(dbConfig);

    // Verificar si el email ya existe
    const [existing] = await connection.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // Insertar usuario (contraseña en texto plano)
    const [result] = await connection.execute(
      "INSERT INTO users (email, password, full_name, phone) VALUES (?, ?, ?, ?)",
      [email, password, full_name, phone || null]
    );

    console.log(`✅ Usuario registrado: ${email}`);

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      userId: result.insertId,
    });

  } catch (error) {
    console.error("❌ Error en registro:", error);
    res.status(500).json({ error: "Error al registrar usuario" });
  } finally {
    if (connection) await connection.end();
  }
});

// 🔐 LOGIN DE USUARIO
router.post("/login", async (req, res) => {
  console.log("=".repeat(50));
  console.log("🔐 LOGIN REQUEST recibido en /api/saas-users/login");
  console.log("📦 Body:", req.body);
  console.log("📦 Headers:", req.headers);
  console.log("=".repeat(50));
  let connection;
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }

    connection = await mysql.createConnection(dbConfig);

    // Buscar usuario
    const [users] = await connection.execute(
      "SELECT id, email, password, full_name, phone, profile_photo FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      // Verificar si el email existe en restaurantes para dar un mensaje más claro
      const [restaurants] = await connection.execute(
        "SELECT id FROM restaurants WHERE email = ?",
        [email]
      );
      
      if (restaurants.length > 0) {
        return res.status(401).json({ 
          error: "Este email pertenece a un restaurante. Para iniciar sesión como restaurante, accede desde el puerto específico del restaurante o desde el panel de administración del restaurante." 
        });
      }
      
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = users[0];

    // Verificar contraseña (texto plano)
    const passwordMatch = password === user.password;

    if (!passwordMatch) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Generar token JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    console.log(`✅ Login exitoso: ${email}`);

    res.json({
      message: "Login exitoso",
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        profile_photo: user.profile_photo,
      },
    });

  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  } finally {
    if (connection) await connection.end();
  }
});

// 👤 OBTENER PERFIL DE USUARIO
router.get("/profile", verifyToken, async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    const [users] = await connection.execute(
      "SELECT id, email, full_name, phone, profile_photo, created_at FROM users WHERE id = ?",
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ user: users[0] });

  } catch (error) {
    console.error("❌ Error al obtener perfil:", error);
    res.status(500).json({ error: "Error al obtener perfil" });
  } finally {
    if (connection) await connection.end();
  }
});

// ✏️ ACTUALIZAR PERFIL DE USUARIO
router.put("/profile", verifyToken, upload.single("profile_photo"), async (req, res) => {
  let connection;
  try {
    const { full_name, phone } = req.body;
    const userId = req.userId;

    connection = await mysql.createConnection(dbConfig);

    let query = "UPDATE users SET full_name = ?, phone = ?";
    let params = [full_name, phone];

    // Si se subió una foto, agregarla
    if (req.file) {
      query += ", profile_photo = ?";
      params.push(`/uploads/profiles/${req.file.filename}`);
    }

    query += " WHERE id = ?";
    params.push(userId);

    await connection.execute(query, params);

    // Obtener usuario actualizado
    const [users] = await connection.execute(
      "SELECT id, email, full_name, phone, profile_photo FROM users WHERE id = ?",
      [userId]
    );

    console.log(`✅ Perfil actualizado: usuario ${userId}`);

    res.json({
      message: "Perfil actualizado exitosamente",
      user: users[0],
    });

  } catch (error) {
    console.error("❌ Error al actualizar perfil:", error);
    res.status(500).json({ error: "Error al actualizar perfil" });
  } finally {
    if (connection) await connection.end();
  }
});

// 📋 OBTENER TODOS LOS USUARIOS (para admin)
router.get("/all", async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    const [users] = await connection.execute(
      `SELECT id, email, full_name, phone, profile_photo, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json({ users });

  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  } finally {
    if (connection) await connection.end();
  }
});

module.exports = router;
