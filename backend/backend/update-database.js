const mysql = require("mysql2/promise");

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || "3306",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "IJgonaldos",
  database: process.env.DB_NAME || "chatbot_reservas",
};

async function updateDatabase() {
  console.log("🔄 Actualizando base de datos para multi-tenancy...\n");

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("✅ Conexión exitosa a la base de datos\n");

    // 1. Verificar si la tabla restaurants existe y tiene las columnas necesarias
    console.log("🔍 Verificando tabla restaurants...");
    const [restaurantsColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${dbConfig.database}' 
      AND TABLE_NAME = 'restaurants'
    `);

    const columnNames = restaurantsColumns.map((col) => col.COLUMN_NAME);
    console.log("Columnas existentes en restaurants:", columnNames);

    // 2. Agregar columnas faltantes a restaurants
    if (!columnNames.includes("puerto")) {
      console.log("📝 Agregando columna puerto...");
      await connection.execute(`
        ALTER TABLE restaurants 
        ADD COLUMN puerto INT UNIQUE DEFAULT NULL
      `);
    }

    if (!columnNames.includes("subdominio")) {
      console.log("📝 Agregando columna subdominio...");
      await connection.execute(`
        ALTER TABLE restaurants 
        ADD COLUMN subdominio VARCHAR(50) UNIQUE DEFAULT NULL
      `);
    }

    if (!columnNames.includes("activo")) {
      console.log("📝 Agregando columna activo...");
      await connection.execute(`
        ALTER TABLE restaurants 
        ADD COLUMN activo BOOLEAN DEFAULT true
      `);
    }

    // 3. Crear tabla port_manager si no existe
    console.log("🔍 Verificando tabla port_manager...");
    const [portManagerTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = '${dbConfig.database}' 
      AND TABLE_NAME = 'port_manager'
    `);

    if (portManagerTables.length === 0) {
      console.log("📝 Creando tabla port_manager...");
      await connection.execute(`
        CREATE TABLE port_manager (
          id INT NOT NULL AUTO_INCREMENT,
          puerto_inicio INT NOT NULL DEFAULT 3000,
          puerto_actual INT NOT NULL DEFAULT 3000,
          puertos_ocupados JSON DEFAULT NULL,
          updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
    }

    // 4. Inicializar port_manager
    console.log("🔍 Verificando datos en port_manager...");
    const [portManagerData] = await connection.execute(
      "SELECT * FROM port_manager WHERE id = 1"
    );

    if (portManagerData.length === 0) {
      console.log("📝 Inicializando port_manager...");
      await connection.execute(`
        INSERT INTO port_manager (id, puerto_inicio, puerto_actual, puertos_ocupados) 
        VALUES (1, 3000, 3000, JSON_ARRAY())
      `);
    }

    // 5. Actualizar restaurantes existentes con puertos y subdominios
    console.log("🔍 Actualizando restaurantes existentes...");
    const [existingRestaurants] = await connection.execute(
      "SELECT * FROM restaurants"
    );

    for (let i = 0; i < existingRestaurants.length; i++) {
      const restaurant = existingRestaurants[i];
      const puerto = 3001 + i;
      const subdominio = generateSubdomain(restaurant.nombre, i);

      console.log(
        `📝 Actualizando ${restaurant.nombre} con puerto ${puerto} y subdominio ${subdominio}`
      );

      await connection.execute(
        `
        UPDATE restaurants 
        SET puerto = ?, subdominio = ?, activo = true 
        WHERE id = ?
      `,
        [puerto, subdominio, restaurant.id]
      );
    }

    // 6. Actualizar port_manager con puertos ocupados
    const puertosOcupados = existingRestaurants.map((_, i) => 3001 + i);
    await connection.execute(
      `
      UPDATE port_manager 
      SET puerto_actual = ?, puertos_ocupados = ? 
      WHERE id = 1
    `,
      [3000 + existingRestaurants.length, JSON.stringify(puertosOcupados)]
    );

    // 7. Verificar que todas las tablas tengan restaurant_id
    console.log("🔍 Verificando columnas restaurant_id...");
    const tablesToCheck = [
      "branches",
      "categorias",
      "menu_items",
      "mesas",
      "reservas",
      "reserva_platos",
      "messages",
    ];

    for (const table of tablesToCheck) {
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = '${dbConfig.database}' 
        AND TABLE_NAME = '${table}'
      `);

      const hasRestaurantId = columns.some(
        (col) => col.COLUMN_NAME === "restaurant_id"
      );

      if (!hasRestaurantId) {
        console.log(`📝 Agregando restaurant_id a tabla ${table}...`);
        await connection.execute(`
          ALTER TABLE ${table} 
          ADD COLUMN restaurant_id INT NOT NULL DEFAULT 1
        `);

        // Agregar foreign key si no existe
        try {
          await connection.execute(`
            ALTER TABLE ${table} 
            ADD CONSTRAINT fk_${table}_restaurant 
            FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
          `);
        } catch (error) {
          console.log(`⚠️  Foreign key ya existe para ${table}`);
        }
      }
    }

    await connection.end();
    console.log("\n✅ Base de datos actualizada exitosamente!");
    console.log("\n📊 Resumen de cambios:");
    console.log(
      "   - Columnas agregadas a restaurants: puerto, subdominio, activo"
    );
    console.log("   - Tabla port_manager creada e inicializada");
    console.log(
      "   - Restaurantes existentes actualizados con puertos y subdominios"
    );
    console.log("   - Columnas restaurant_id verificadas en todas las tablas");
  } catch (error) {
    console.error("❌ Error actualizando base de datos:", error);
    console.log("\n💡 Soluciones posibles:");
    console.log("   - Verifica que MySQL esté ejecutándose");
    console.log("   - Verifica las credenciales de la base de datos");
    console.log("   - Asegúrate de tener permisos de administrador");
  }
}

function generateSubdomain(nombre, index) {
  const base = nombre
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return index === 0 ? base : `${base}-${index + 1}`;
}

// Ejecutar actualización
if (require.main === module) {
  updateDatabase();
}

module.exports = { updateDatabase };
