const mysql = require("mysql2/promise");
require("dotenv").config();

async function testConnection() {
  console.log("🔍 Probando conexión a la base de datos...");
  console.log("Configuración:", {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "chatbot_reservas",
  });

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "chatbot_reservas",
    });

    console.log("✅ Conexión exitosa a MySQL");

    // Probar consulta a branches
    const [branches] = await connection.execute("SELECT * FROM branches");
    console.log("📊 Branches encontrados:", branches.length);
    console.log("Primer branch:", branches[0]);

    // Probar consulta a categorias
    const [categorias] = await connection.execute("SELECT * FROM categorias");
    console.log("📊 Categorías encontradas:", categorias.length);

    // Probar consulta a menu_items
    const [menuItems] = await connection.execute("SELECT * FROM menu_items");
    console.log("📊 Items de menú encontrados:", menuItems.length);

    await connection.end();
    console.log("✅ Todas las pruebas pasaron correctamente");
  } catch (error) {
    console.error("❌ Error en la conexión:", error.message);

    if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.log("💡 Solución: Verifica las credenciales de MySQL");
    } else if (error.code === "ECONNREFUSED") {
      console.log("💡 Solución: MySQL no está ejecutándose");
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.log("💡 Solución: La base de datos no existe");
    }
  }
}

testConnection();
