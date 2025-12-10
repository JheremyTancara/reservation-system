const express = require("express");
const mysql = require("mysql2/promise");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const { spawn } = require("child_process");

const router = express.Router();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || "3306",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "AlejandraVargas12",
  database: process.env.DB_NAME || "chatbot_reservas",
};

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/subscriptions");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Función para obtener el siguiente puerto disponible (empieza en 3001)
// Solo consideramos los puertos ya usados en restaurantes para no saltar números.
async function getNextAvailablePort() {
  const connection = await mysql.createConnection(dbConfig);
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

// Email del admin configurado. Si necesitas que sea dinámico, usa env vars.
const ADMIN_EMAIL_FALLBACK = "jheremykay777@gmail.com";

async function getAdminEmail() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.execute(
      "SELECT setting_value FROM admin_settings WHERE setting_key = 'admin_email'"
    );
    if (rows.length > 0 && rows[0].setting_value) {
      return rows[0].setting_value;
    }
    return ADMIN_EMAIL_FALLBACK;
  } finally {
    await connection.end();
  }
}

// Función para enviar email
async function sendEmail(to, subject, html) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Error enviando email:", error);
    return false;
  }
}

// 📝 REGISTRO DE SOLICITUD DE RESTAURANTE
router.post("/register-restaurant", upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
  { name: 'payment_proof', maxCount: 1 }
]), async (req, res) => {
  let connection;
  try {
    const { 
      user_id, 
      restaurant_name, 
      restaurant_password, 
      restaurant_email, 
      restaurant_phone,
      restaurant_address
    } = req.body;

    if (!user_id || !restaurant_name || !restaurant_password || !restaurant_email) {
      return res.status(400).json({ 
        error: "Usuario, nombre del restaurante, contraseña y email son requeridos" 
      });
    }

    connection = await mysql.createConnection(dbConfig);

    // Verificar que el usuario existe
    const [users] = await connection.execute(
      "SELECT id FROM users WHERE id = ?",
      [user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verificar si el email del restaurante ya existe
    const [existingRestaurants] = await connection.execute(
      "SELECT id FROM restaurants WHERE email = ?",
      [restaurant_email]
    );

    if (existingRestaurants.length > 0) {
      return res.status(400).json({ error: "El email del restaurante ya está registrado" });
    }

    // Obtener puerto disponible
    const port = await getNextAvailablePort();

    // Guardar rutas de archivos
    const logoPath = req.files?.logo?.[0] ? `/uploads/subscriptions/${req.files.logo[0].filename}` : null;
    const coverPath = req.files?.cover?.[0] ? `/uploads/subscriptions/${req.files.cover[0].filename}` : null;
    const paymentProofPath = req.files?.payment_proof?.[0] ? `/uploads/subscriptions/${req.files.payment_proof[0].filename}` : null;

    // Generar subdominio único
    let subdomain = restaurant_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    let counter = 1;
    let finalSubdomain = subdomain;

    while (true) {
      const [existing] = await connection.execute(
        "SELECT id FROM restaurants WHERE subdominio = ?",
        [finalSubdomain]
      );
      if (existing.length === 0) break;
      finalSubdomain = `${subdomain}-${counter}`;
      counter++;
    }

    // Insertar restaurante con estado 'pending'
    const [result] = await connection.execute(
      `INSERT INTO restaurants 
       (nombre, email, password, telefono, direccion, puerto, subdominio, activo, user_id, subscription_status, payment_proof_path, logo_path, cover_path) 
       VALUES (?, ?, ?, ?, ?, ?, ?, false, ?, 'pending', ?, ?, ?)`,
      [
        restaurant_name,
        restaurant_email,
        restaurant_password, // texto plano
        restaurant_phone || null,
        restaurant_address || null,
        port,
        finalSubdomain,
        user_id,
        paymentProofPath,
        logoPath,
        coverPath
      ]
    );

    const restaurantId = result.insertId;

    // Obtener datos del usuario para el email
    const [userData] = await connection.execute(
      "SELECT email, full_name FROM users WHERE id = ?",
      [user_id]
    );

    // Enviar email al admin
    const adminEmail = await getAdminEmail();
    const adminEmailHtml = `
      <h2>Nueva Solicitud de Registro de Restaurante</h2>
      <p>Se ha recibido una nueva solicitud de registro de restaurante:</p>
      <ul>
        <li><strong>Nombre del Restaurante:</strong> ${restaurant_name}</li>
        <li><strong>Email:</strong> ${restaurant_email}</li>
        <li><strong>Teléfono:</strong> ${restaurant_phone || 'N/A'}</li>
        <li><strong>Dirección:</strong> ${restaurant_address || 'N/A'}</li>
        <li><strong>Puerto asignado:</strong> ${port}</li>
        <li><strong>Usuario solicitante:</strong> ${userData[0].full_name} (${userData[0].email})</li>
        <li><strong>Comprobante:</strong> ${paymentProofPath ? `<a href="http://localhost:3000${paymentProofPath}">Ver comprobante</a>` : 'No adjuntado'}</li>
      </ul>
      <p>Revisa el comprobante y los datos en el panel de administración.</p>
      <p><a href="http://localhost:5173/admin">Ir al Panel de Administración</a></p>
    `;

    await sendEmail(adminEmail, "Nueva Solicitud de Registro de Restaurante", adminEmailHtml);

    console.log(`✅ Solicitud de restaurante registrada: ${restaurant_name}`);

    res.status(201).json({
      message: "Solicitud de registro enviada exitosamente",
      restaurant_id: restaurantId,
      port: port,
    });

  } catch (error) {
    console.error("❌ Error en registro de restaurante:", error);
    res.status(500).json({ error: "Error al registrar solicitud de restaurante" });
  } finally {
    if (connection) await connection.end();
  }
});

// 📋 OBTENER SOLICITUDES DE SUSCRIPCIÓN (para admin) - Restaurantes pendientes
router.get("/subscription-requests", async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    const [requests] = await connection.execute(
      `SELECT r.*, u.email as user_email, u.full_name as user_name 
       FROM restaurants r 
       LEFT JOIN users u ON r.user_id = u.id 
       WHERE r.subscription_status = 'pending'
       ORDER BY r.created_at DESC`
    );

    res.json({ requests });

  } catch (error) {
    console.error("❌ Error obteniendo solicitudes:", error);
    res.status(500).json({ error: "Error al obtener solicitudes" });
  } finally {
    if (connection) await connection.end();
  }
});

// ✅ APROBAR SOLICITUD DE RESTAURANTE
router.post("/approve-subscription/:id", async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    connection = await mysql.createConnection(dbConfig);

    // Obtener el restaurante
    const [restaurants] = await connection.execute(
      `SELECT r.*, u.email as user_email, u.full_name as user_name 
       FROM restaurants r 
       LEFT JOIN users u ON r.user_id = u.id 
       WHERE r.id = ?`,
      [id]
    );

    if (restaurants.length === 0) {
      return res.status(404).json({ error: "Restaurante no encontrado" });
    }

    const restaurant = restaurants[0];

    if (restaurant.subscription_status !== 'pending') {
      return res.status(400).json({ error: "La solicitud ya fue procesada" });
    }

    // Actualizar estado a 'active' y activar el restaurante
    await connection.execute(
      `UPDATE restaurants 
       SET subscription_status = 'active', activo = true, admin_notes = ?, last_updated = NOW() 
       WHERE id = ?`,
      [admin_notes || 'Aprobado', id]
    );

    // Actualizar port_manager
    const [portManager] = await connection.execute(
      "SELECT * FROM port_manager WHERE id = 1"
    );

    if (portManager.length > 0) {
      let occupiedPorts = [];
      try {
        const portsData = portManager[0].puertos_ocupados;
        if (portsData) {
          occupiedPorts = typeof portsData === 'string' ? JSON.parse(portsData) : portsData;
        }
      } catch (e) {
        occupiedPorts = [];
      }
      if (!occupiedPorts.includes(restaurant.puerto)) {
        occupiedPorts.push(restaurant.puerto);
      }
      await connection.execute(
        "UPDATE port_manager SET puerto_actual = ?, puertos_ocupados = ? WHERE id = 1",
        [restaurant.puerto, JSON.stringify(occupiedPorts)]
      );
    }

    // Iniciar instancia del tenant
    try {
      console.log(`🚀 Iniciando instancia del tenant para ${restaurant.nombre} en puerto ${restaurant.puerto}`);
      
      const tenantServerPath = path.join(__dirname, "..", "tenant-server.js");
      const child = spawn("node", [tenantServerPath], {
        cwd: path.join(__dirname, ".."),
        env: {
          ...process.env,
          TENANT_PORT: restaurant.puerto.toString(),
          TENANT_ID: restaurant.id.toString(),
          TENANT_SUBDOMAIN: restaurant.subdominio,
          TENANT_NAME: restaurant.nombre,
        },
        stdio: ["pipe", "pipe", "pipe"],
      });

      child.stdout.on("data", (data) => {
        console.log(`[${restaurant.nombre}:${restaurant.puerto}] ${data.toString().trim()}`);
      });

      child.stderr.on("data", (data) => {
        console.error(`[${restaurant.nombre}:${restaurant.puerto}] ERROR: ${data.toString().trim()}`);
      });

      child.on("close", (code) => {
        console.log(`[${restaurant.nombre}:${restaurant.puerto}] Proceso terminado con código ${code}`);
      });

      // Esperar un poco para que el servidor se inicie
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log(`✅ Instancia del tenant iniciada para ${restaurant.nombre}`);
    } catch (startError) {
      console.error(`❌ Error iniciando instancia del tenant para ${restaurant.nombre}:`, startError);
      // Continuar de todas formas, el master-server puede iniciarlo después
    }

    // Enviar email al usuario con las credenciales
    const loginUrl = `http://localhost:${restaurant.puerto}/login`;
    const chatbotUrl = `http://localhost:5174/${restaurant.puerto}-chat-client/`;
    
    // La contraseña está en texto plano en la BD
    const restaurantPassword = restaurant.password;
    
    const userEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">¡Tu solicitud de restaurante ha sido aprobada!</h2>
        <p>Hola <strong>${restaurant.user_name || 'Usuario'}</strong>,</p>
        <p>Nos complace informarte que tu solicitud para registrar el restaurante <strong>${restaurant.nombre}</strong> ha sido aprobada.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Credenciales de acceso:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;"><strong>Email:</strong> ${restaurant.email}</li>
            <li style="margin: 10px 0;"><strong>Contraseña:</strong> ${restaurantPassword}</li>
          </ul>
        </div>
        
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">URLs de acceso:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;">
              <strong>Panel de administración:</strong><br>
              <a href="${loginUrl}" style="color: #2563eb; text-decoration: none;">${loginUrl}</a>
            </li>
            <li style="margin: 10px 0;">
              <strong>Chatbot del restaurante:</strong><br>
              <a href="${chatbotUrl}" style="color: #2563eb; text-decoration: none;">${chatbotUrl}</a>
            </li>
          </ul>
          <p style="margin: 10px 0;"><strong>Puerto asignado:</strong> ${restaurant.puerto}</p>
        </div>
        
        <p style="color: #059669; font-weight: bold;">¡Ya puedes comenzar a usar el sistema y entrenar tu chatbot!</p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Si tienes alguna pregunta, no dudes en contactarnos.
        </p>
      </div>
    `;

    // Enviar correo al usuario que registró el restaurante (user_email es el correo del usuario que compró el servicio)
    if (restaurant.user_email) {
      console.log(`📧 Enviando correo de aprobación a: ${restaurant.user_email}`);
      const emailSent = await sendEmail(restaurant.user_email, "Solicitud de Restaurante Aprobada", userEmailHtml);
      if (emailSent) {
        console.log(`✅ Correo enviado exitosamente a: ${restaurant.user_email}`);
      } else {
        console.error(`❌ Error al enviar correo a: ${restaurant.user_email}`);
      }
    } else {
      console.warn(`⚠️ No se encontró user_email para el restaurante ${restaurant.nombre}`);
    }
    
    // También enviar al email del restaurante por si acaso (pero el principal es user_email)
    if (restaurant.email && restaurant.email !== restaurant.user_email) {
      console.log(`📧 Enviando correo de aprobación también a: ${restaurant.email}`);
      await sendEmail(restaurant.email, "Solicitud de Restaurante Aprobada", userEmailHtml);
    }

    console.log(`✅ Restaurante aprobado: ${restaurant.nombre}`);

    res.json({
      message: "Restaurante aprobado exitosamente",
      restaurant_id: restaurant.id,
      login_url: loginUrl,
      chatbot_url: chatbotUrl,
    });

  } catch (error) {
    console.error("❌ Error aprobando solicitud:", error);
    res.status(500).json({ error: "Error al aprobar solicitud" });
  } finally {
    if (connection) await connection.end();
  }
});

// ❌ RECHAZAR SOLICITUD DE RESTAURANTE
router.post("/reject-subscription/:id", async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    if (!admin_notes) {
      return res.status(400).json({ error: "Las notas del administrador son requeridas" });
    }

    connection = await mysql.createConnection(dbConfig);

    // Obtener el restaurante
    const [restaurants] = await connection.execute(
      `SELECT r.*, u.email as user_email, u.full_name as user_name 
       FROM restaurants r 
       LEFT JOIN users u ON r.user_id = u.id 
       WHERE r.id = ?`,
      [id]
    );

    if (restaurants.length === 0) {
      return res.status(404).json({ error: "Restaurante no encontrado" });
    }

    const restaurant = restaurants[0];

    // Actualizar estado a 'cancelled'
    await connection.execute(
      `UPDATE restaurants 
       SET subscription_status = 'cancelled', admin_notes = ?, last_updated = NOW() 
       WHERE id = ?`,
      [admin_notes, id]
    );

    // Enviar email al usuario
    const userEmailHtml = `
      <h2>Solicitud de Restaurante Rechazada</h2>
      <p>Hola ${restaurant.user_name || 'Usuario'},</p>
      <p>Lamentamos informarte que tu solicitud para registrar el restaurante <strong>${restaurant.nombre}</strong> ha sido rechazada.</p>
      <p><strong>Motivo:</strong> ${admin_notes}</p>
      <p>Si tienes alguna pregunta, por favor contacta al administrador.</p>
    `;

    if (restaurant.user_email) {
      await sendEmail(restaurant.user_email, "Solicitud de Restaurante Rechazada", userEmailHtml);
    }
    await sendEmail(restaurant.email, "Solicitud de Restaurante Rechazada", userEmailHtml);

    console.log(`❌ Solicitud rechazada: ${restaurant.nombre}`);

    res.json({ message: "Solicitud rechazada exitosamente" });

  } catch (error) {
    console.error("❌ Error rechazando solicitud:", error);
    res.status(500).json({ error: "Error al rechazar solicitud" });
  } finally {
    if (connection) await connection.end();
  }
});

module.exports = router;
