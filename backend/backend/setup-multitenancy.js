const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || "3306",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "IJgonaldos",
  database: process.env.DB_NAME || "chatbot_reservas",
};

async function setupMultiTenancy() {
  console.log("🚀 Configurando Sistema Multi-Tenancy...\n");

  try {
    // 1. Conectar a la base de datos
    console.log("📊 Conectando a la base de datos...");
    const connection = await mysql.createConnection(dbConfig);
    console.log("✅ Conexión exitosa\n");

    // 2. Verificar que las tablas existen
    console.log("🔍 Verificando estructura de la base de datos...");
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = '${dbConfig.database}'
    `);

    const requiredTables = [
      "restaurants",
      "branches",
      "categorias",
      "menu_items",
      "mesas",
      "reservas",
      "reserva_platos",
      "messages",
      "port_manager",
    ];

    const existingTables = tables.map((t) => t.TABLE_NAME);
    const missingTables = requiredTables.filter(
      (t) => !existingTables.includes(t)
    );

    if (missingTables.length > 0) {
      console.log("❌ Faltan las siguientes tablas:", missingTables);
      console.log("💡 Ejecuta el archivo proyecto_chatboot.sql primero\n");
      await connection.end();
      return;
    }

    console.log("✅ Todas las tablas requeridas existen\n");

    // 3. Verificar port_manager
    console.log("🔧 Verificando configuración de puertos...");
    const [portManager] = await connection.execute(
      "SELECT * FROM port_manager WHERE id = 1"
    );

    if (portManager.length === 0) {
      console.log("📝 Inicializando port_manager...");
      await connection.execute(`
        INSERT INTO port_manager (puerto_inicio, puerto_actual, puertos_ocupados) 
        VALUES (3000, 3000, JSON_ARRAY())
      `);
      console.log("✅ Port manager inicializado\n");
    } else {
      console.log("✅ Port manager ya configurado\n");
    }

    // 4. Verificar restaurantes existentes
    console.log("🍽️  Verificando restaurantes existentes...");
    const [restaurants] = await connection.execute("SELECT * FROM restaurants");

    if (restaurants.length === 0) {
      console.log("📝 No hay restaurantes configurados");
      console.log(
        "💡 Usa el panel de control para crear el primer restaurante\n"
      );
    } else {
      console.log(`✅ ${restaurants.length} restaurantes encontrados:`);
      restaurants.forEach((restaurant) => {
        console.log(
          `   - ${restaurant.nombre} (${restaurant.subdominio}:${restaurant.puerto})`
        );
      });
      console.log();
    }

    // 5. Verificar datos de ejemplo
    console.log("📊 Verificando datos de ejemplo...");
    const [branches] = await connection.execute(
      "SELECT COUNT(*) as count FROM branches"
    );
    const [menuItems] = await connection.execute(
      "SELECT COUNT(*) as count FROM menu_items"
    );
    const [categorias] = await connection.execute(
      "SELECT COUNT(*) as count FROM categorias"
    );

    console.log(`   - Sucursales: ${branches[0].count}`);
    console.log(`   - Items de menú: ${menuItems[0].count}`);
    console.log(`   - Categorías: ${categorias[0].count}`);
    console.log();

    await connection.end();

    // 6. Verificar archivos del sistema
    console.log("📁 Verificando archivos del sistema...");
    const requiredFiles = [
      "master-server.js",
      "tenant-server.js",
      "package.json",
    ];

    const missingFiles = requiredFiles.filter(
      (file) => !fs.existsSync(path.join(__dirname, file))
    );

    if (missingFiles.length > 0) {
      console.log("❌ Faltan los siguientes archivos:", missingFiles);
      console.log("💡 Asegúrate de que todos los archivos estén creados\n");
      return;
    }

    console.log("✅ Todos los archivos del sistema existen\n");

    // 7. Instrucciones finales
    console.log("🎉 Configuración completada exitosamente!\n");
    console.log("📋 Próximos pasos:");
    console.log("   1. Instala las dependencias: npm install");
    console.log("   2. Inicia el servidor maestro: npm start");
    console.log(
      "   3. Accede al panel de control: http://localhost:3000/master"
    );
    console.log("   4. Crea tu primer restaurante desde el panel\n");
    console.log("🔗 URLs del sistema:");
    console.log("   - Panel de Control: http://localhost:3000/master");
    console.log("   - API Maestra: http://localhost:3000/api");
    console.log(
      "   - Frontend: http://localhost:5173 (después de iniciar el frontend)\n"
    );
  } catch (error) {
    console.error("❌ Error durante la configuración:", error.message);
    console.log("\n💡 Soluciones posibles:");
    console.log("   - Verifica que MySQL esté ejecutándose");
    console.log("   - Verifica las credenciales de la base de datos");
    console.log("   - Ejecuta el archivo proyecto_chatboot.sql primero");
    console.log("   - Verifica que la base de datos chatbot_reservas existe");
  }
}

// Función para probar la creación de un restaurante
async function testRestaurantCreation() {
  console.log("🧪 Probando creación de restaurante...\n");

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Simular creación de restaurante
    const testRestaurant = {
      nombre: "Restaurante de Prueba",
      email: "test@example.com",
      password: "$2b$10$example",
      telefono: "123456789",
      direccion: "Dirección de prueba",
      puerto: 9999, // Puerto de prueba
      subdominio: "test-restaurant",
    };

    // Verificar si ya existe
    const [existing] = await connection.execute(
      "SELECT id FROM restaurants WHERE email = ? OR subdominio = ?",
      [testRestaurant.email, testRestaurant.subdominio]
    );

    if (existing.length > 0) {
      console.log("✅ Restaurante de prueba ya existe");
    } else {
      // Crear restaurante de prueba
      await connection.execute(
        `
        INSERT INTO restaurants (nombre, email, password, telefono, direccion, puerto, subdominio, activo)
        VALUES (?, ?, ?, ?, ?, ?, ?, false)
      `,
        [
          testRestaurant.nombre,
          testRestaurant.email,
          testRestaurant.password,
          testRestaurant.telefono,
          testRestaurant.direccion,
          testRestaurant.puerto,
          testRestaurant.subdominio,
        ]
      );
      console.log("✅ Restaurante de prueba creado exitosamente");
    }

    await connection.end();
    console.log("✅ Prueba completada\n");
  } catch (error) {
    console.error("❌ Error en la prueba:", error.message);
  }
}

// Ejecutar configuración
if (require.main === module) {
  setupMultiTenancy().then(() => {
    testRestaurantCreation();
  });
}

module.exports = { setupMultiTenancy, testRestaurantCreation };
