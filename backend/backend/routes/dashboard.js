const express = require("express");
const mysql = require("mysql2/promise");

const router = express.Router();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || "3306",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "IJgonaldos",
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

// Obtener estadísticas del restaurante
router.get("/estadisticas/:restaurantId", async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const connection = await connectDB();

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
});

// Obtener reservas recientes
router.get("/reservas-recientes/:restaurantId", async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const connection = await connectDB();

    const [reservas] = await connection.execute(
      `SELECT r.*, b.nombre as branch_nombre 
       FROM reservas r 
       LEFT JOIN branches b ON r.branch_id = b.id 
       WHERE r.restaurant_id = ? 
       ORDER BY r.created_at DESC 
       LIMIT 10`,
      [restaurantId]
    );

    await connection.end();
    res.json(reservas);
  } catch (error) {
    console.error("Error obteniendo reservas recientes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener mesas disponibles
router.get("/mesas-disponibles/:restaurantId", async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const connection = await connectDB();

    const [mesas] = await connection.execute(
      `SELECT m.*, b.nombre as branch_nombre 
       FROM mesas m 
       LEFT JOIN branches b ON m.branch_id = b.id 
       WHERE m.restaurant_id = ? AND m.disponible = 1`,
      [restaurantId]
    );

    await connection.end();
    res.json(mesas);
  } catch (error) {
    console.error("Error obteniendo mesas disponibles:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
