const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || "3306",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "AlejandraVargas12",
  database: process.env.DB_NAME || "chatbot_reservas",
};

async function addDescripcionColumn() {
  console.log("🔄 Agregando columna descripcion a la tabla mesas...\n");

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("✅ Conexión exitosa a la base de datos\n");

    // Verificar si la columna ya existe
    console.log("🔍 Verificando si la columna descripcion existe...");
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'mesas'
      AND COLUMN_NAME = 'descripcion'
    `, [dbConfig.database]);

    if (columns.length > 0) {
      console.log("✅ La columna descripcion ya existe en la tabla mesas\n");
      await connection.end();
      return;
    }

    // Agregar la columna descripcion
    console.log("📝 Agregando columna descripcion...");
    await connection.execute(`
      ALTER TABLE mesas 
      ADD COLUMN descripcion VARCHAR(255) DEFAULT NULL
    `);
    console.log("✅ Columna descripcion agregada exitosamente\n");

    await connection.end();
    console.log("✅ Proceso completado exitosamente!");
  } catch (error) {
    console.error("❌ Error agregando columna:", error);
    console.log("\n💡 Soluciones posibles:");
    console.log("   - Verifica que MySQL esté ejecutándose");
    console.log("   - Verifica las credenciales de la base de datos");
    console.log("   - Asegúrate de tener permisos de administrador");
    process.exit(1);
  }
}

addDescripcionColumn();

