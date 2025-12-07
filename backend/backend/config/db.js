const mysql = require("mysql2/promise");
require("dotenv").config();

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "chatbot_reservas",
  port: process.env.DB_PORT || 3306,
});

// Verificar la conexión
db.getConnection()
  .then((connection) => {
    console.log("✅ Conectado a la base de datos MySQL local con éxito");
    console.log(`Base de datos: ${process.env.DB_NAME || "chatbot_reservas"}`);
    connection.release();
  })
  .catch((err) => {
    console.error("❌ Error al conectar a la base de datos:", err);
  });

module.exports = db;
