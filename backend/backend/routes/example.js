// routes/example.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

console.log("✅ exampleRoutes cargado");

// Ruta de prueba: conexión con base de datos
router.get("/test-db", (req, res) => {
  db.query("SELECT NOW() as fecha_actual", (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Error en la consulta" });
    }
    res.json({ resultado: result[0] });
  });
});

// Obtener sucursales (branches)
router.get("/branches", (req, res) => {
  db.query("SELECT id, nombre FROM branches", (err, result) => {
    if (err)
      return res.status(500).json({ error: "Error al obtener sucursales" });
    res.json(result);
  });
});

// Registro de restaurante
router.post("/register", async (req, res) => {
  const { email, password, rol, branch_id } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const query =
    "INSERT INTO restaurants (email, password, rol, branch_id) VALUES (?, ?, ?, ?)";
  db.query(query, [email, hashedPassword, rol, branch_id], (err, result) => {
    if (err) {
      console.error("Error al registrar restaurante:", err);
      return res
        .status(500)
        .json({ error: "No se pudo registrar el restaurante" });
    }
    res.json({ message: "Restaurante registrado correctamente" });
  });
});

// Login de restaurante
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM restaurants WHERE email = ?";
  db.query(query, [email], async (err, results) => {
    if (err)
      return res.status(500).json({ error: "Error en la base de datos" });
    if (results.length === 0)
      return res.status(401).json({ error: "Restaurante no encontrado" });

    const restaurant = results[0];
    const validPassword = await bcrypt.compare(password, restaurant.password);
    if (!validPassword)
      return res.status(401).json({ error: "Contraseña incorrecta" });

    // Crear token si lo deseas, opcional
    const token = jwt.sign(
      { id: restaurant.id, email: restaurant.email },
      process.env.JWT_SECRET || "mi_secreto_jwt_super_seguro_2024",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login exitoso",
      restaurant: {
        id: restaurant.id,
        email: restaurant.email,
        rol: restaurant.rol,
        branch_id: restaurant.branch_id,
      },
      token,
    });
  });
});

module.exports = router;
