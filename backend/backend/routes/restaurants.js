const express = require("express");
const router = express.Router();
const db = require("../config/db");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Registro
router.post("/register", async (req, res) => {
  const { email, password, rol, branch_id } = req.body;
  try {
    // Verificar si el correo ya existe
    const [existingRestaurants] = await db.query(
      "SELECT * FROM restaurants WHERE email = ?",
      [email]
    );
    if (existingRestaurants.length > 0) {
      return res
        .status(400)
        .send({ error: "El correo electrónico ya está registrado" });
    }

    await db.query(
      "INSERT INTO restaurants (email, password, rol, branch_id) VALUES (?, ?, ?, ?)",
      [email, password, rol || "admin", branch_id]
    );
    res.send({ msg: "Restaurante registrado" });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query(
      "SELECT * FROM restaurants WHERE email = ? AND password = ?",
      [email, password]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    const restaurant = rows[0];
    res.json({ msg: "Login exitoso", restaurant });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Solicitud de recuperación
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const token = crypto.randomBytes(32).toString("hex");
    const expire = new Date(Date.now() + 3600000); // 1 hora

    await db.query(
      "UPDATE restaurants SET reset_token = ?, reset_token_expire = ? WHERE email = ?",
      [token, expire, email]
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Usar el nuevo dominio para el panel de administración
    const frontendUrl =
      process.env.NODE_ENV === "production"
        ? "https://admi-gussrestobar.netlify.app"
        : "http://localhost:5173";

    const link = `${frontendUrl}/reset-password/${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Recuperar contraseña",
      html: `<p>Haz clic en el siguiente enlace para cambiar tu contraseña:</p>
             <a href="${link}">${link}</a>
             <p>Este enlace expirará en 1 hora.</p>`,
    });

    res.send({ msg: "Correo enviado. Revisa tu bandeja de entrada." });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Reset de contraseña
router.post("/reset-password", async (req, res) => {
  const { token, nuevaPassword } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT * FROM restaurants WHERE reset_token = ? AND reset_token_expire > NOW()",
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: "Token inválido o expirado" });
    }

    await db.query(
      "UPDATE restaurants SET password = ?, reset_token = NULL, reset_token_expire = NULL WHERE id = ?",
      [nuevaPassword, rows[0].id]
    );

    res.send({ msg: "Contraseña actualizada con éxito" });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

module.exports = router;
