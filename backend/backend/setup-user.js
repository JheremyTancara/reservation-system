const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || "3306",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "IJgonaldos",
  database: process.env.DB_NAME || "chatbot_reservas",
};

async function setupUserAndImages() {
  console.log("🚀 Configurando usuario de prueba y campos de imágenes...\n");

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("✅ Conexión exitosa a la base de datos\n");

    // 1. Verificar y agregar columnas de imágenes
    console.log("🔍 Verificando columnas de imágenes...");
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'restaurants'
    `, [dbConfig.database]);

    const columnNames = columns.map((col) => col.COLUMN_NAME);

    if (!columnNames.includes("logo_url")) {
      console.log("📝 Agregando columna logo_url...");
      await connection.execute(`
        ALTER TABLE restaurants 
        ADD COLUMN logo_url TEXT DEFAULT NULL
      `);
    }

    if (!columnNames.includes("imagen_url")) {
      console.log("📝 Agregando columna imagen_url...");
      await connection.execute(`
        ALTER TABLE restaurants 
        ADD COLUMN imagen_url TEXT DEFAULT NULL COMMENT 'Imagen para mostrar en la lista de restaurantes'
      `);
    }

    if (!columnNames.includes("background_url")) {
      console.log("📝 Agregando columna background_url...");
      await connection.execute(`
        ALTER TABLE restaurants 
        ADD COLUMN background_url TEXT DEFAULT NULL COMMENT 'Imagen de fondo para login/registro'
      `);
    }

    if (!columnNames.includes("carrusel_images")) {
      console.log("📝 Agregando columna carrusel_images...");
      await connection.execute(`
        ALTER TABLE restaurants 
        ADD COLUMN carrusel_images JSON DEFAULT NULL COMMENT 'Array de URLs de imágenes para el carrusel (3-5 imágenes)'
      `);
    }

    if (!columnNames.includes("divisa")) {
      console.log("📝 Agregando columna divisa...");
      await connection.execute(`
        ALTER TABLE restaurants 
        ADD COLUMN divisa VARCHAR(10) DEFAULT 'BS' COMMENT 'Divisa del restaurante (BS, USD, EUR)'
      `);
    }

    // 2. Obtener siguiente puerto disponible
    console.log("\n🔍 Obteniendo puerto disponible...");
    const [portManager] = await connection.execute(
      "SELECT * FROM port_manager WHERE id = 1"
    );

    let nextPort = 3003;
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
      if (occupiedPorts.length > 0) {
        nextPort = Math.max(...occupiedPorts, 3002) + 1;
      }
    }

    // 3. Verificar si el usuario ya existe
    const [existing] = await connection.execute(
      "SELECT id FROM restaurants WHERE email = ?",
      ["admin@mesacloud.com"]
    );

    if (existing.length > 0) {
      console.log("⚠️  Usuario admin@mesacloud.com ya existe, actualizando...");
      await connection.execute(
        `UPDATE restaurants SET 
          nombre = ?,
          password = ?,
          telefono = ?,
          direccion = ?,
          puerto = ?,
          subdominio = ?,
          logo_url = ?,
          imagen_url = ?,
          background_url = ?,
          carrusel_images = ?,
          divisa = ?,
          activo = true
        WHERE email = ?`,
        [
          "MesaCloud Demo",
          "admin123", // Password en texto plano (el sistema lo maneja así)
          "70123456",
          "Av. Principal 100",
          nextPort,
          "mesacloud-demo",
          "https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=Logo",
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
          "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920",
          JSON.stringify([
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"
          ]),
          "BS",
          "admin@mesacloud.com"
        ]
      );
    } else {
      console.log("📝 Creando usuario de prueba...");
      await connection.execute(
        `INSERT INTO restaurants (
          nombre, email, password, telefono, direccion, 
          puerto, subdominio, activo,
          logo_url, imagen_url, background_url, carrusel_images, divisa
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "MesaCloud Demo",
          "admin@mesacloud.com",
          "admin123",
          "70123456",
          "Av. Principal 100",
          nextPort,
          "mesacloud-demo",
          true,
          "https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=Logo",
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
          "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920",
          JSON.stringify([
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"
          ]),
          "BS"
        ]
      );
    }

    // 4. Actualizar port_manager
    const [currentPorts] = await connection.execute(
      "SELECT puertos_ocupados FROM port_manager WHERE id = 1"
    );
    let occupiedPorts = [];
    if (currentPorts.length > 0 && currentPorts[0].puertos_ocupados) {
      try {
        const portsData = currentPorts[0].puertos_ocupados;
        occupiedPorts = typeof portsData === 'string' ? JSON.parse(portsData) : portsData;
      } catch (e) {
        occupiedPorts = [];
      }
    }
    if (!occupiedPorts.includes(nextPort)) {
      occupiedPorts.push(nextPort);
    }
    await connection.execute(
      "UPDATE port_manager SET puerto_actual = ?, puertos_ocupados = ? WHERE id = 1",
      [nextPort, JSON.stringify(occupiedPorts)]
    );

    // 5. Mostrar credenciales
    const [user] = await connection.execute(
      "SELECT email, password, puerto, subdominio FROM restaurants WHERE email = ?",
      ["admin@mesacloud.com"]
    );

    await connection.end();

    console.log("\n✅ Usuario de prueba configurado exitosamente!\n");
    console.log("🔑 CREDENCIALES DE ACCESO:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📧 Email:    ${user[0].email}`);
    console.log(`🔐 Password: ${user[0].password}`);
    console.log(`🔌 Puerto:   ${user[0].puerto}`);
    console.log(`🌐 URL:      http://localhost:${user[0].puerto}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupUserAndImages();
}

module.exports = { setupUserAndImages };





// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || "3306",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "IJgonaldos",
  database: process.env.DB_NAME || "chatbot_reservas",
};

async function setupUserAndImages() {
  console.log("🚀 Configurando usuario de prueba y campos de imágenes...\n");

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("✅ Conexión exitosa a la base de datos\n");

    // 1. Verificar y agregar columnas de imágenes
    console.log("🔍 Verificando columnas de imágenes...");
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'restaurants'
    `, [dbConfig.database]);

    const columnNames = columns.map((col) => col.COLUMN_NAME);

    if (!columnNames.includes("logo_url")) {
      console.log("📝 Agregando columna logo_url...");
      await connection.execute(`
        ALTER TABLE restaurants 
        ADD COLUMN logo_url TEXT DEFAULT NULL
      `);
    }

    if (!columnNames.includes("imagen_url")) {
      console.log("📝 Agregando columna imagen_url...");
      await connection.execute(`
        ALTER TABLE restaurants 
        ADD COLUMN imagen_url TEXT DEFAULT NULL COMMENT 'Imagen para mostrar en la lista de restaurantes'
      `);
    }

    if (!columnNames.includes("background_url")) {
      console.log("📝 Agregando columna background_url...");
      await connection.execute(`
        ALTER TABLE restaurants 
        ADD COLUMN background_url TEXT DEFAULT NULL COMMENT 'Imagen de fondo para login/registro'
      `);
    }

    if (!columnNames.includes("carrusel_images")) {
      console.log("📝 Agregando columna carrusel_images...");
      await connection.execute(`
        ALTER TABLE restaurants 
        ADD COLUMN carrusel_images JSON DEFAULT NULL COMMENT 'Array de URLs de imágenes para el carrusel (3-5 imágenes)'
      `);
    }

    if (!columnNames.includes("divisa")) {
      console.log("📝 Agregando columna divisa...");
      await connection.execute(`
        ALTER TABLE restaurants 
        ADD COLUMN divisa VARCHAR(10) DEFAULT 'BS' COMMENT 'Divisa del restaurante (BS, USD, EUR)'
      `);
    }

    // 2. Obtener siguiente puerto disponible
    console.log("\n🔍 Obteniendo puerto disponible...");
    const [portManager] = await connection.execute(
      "SELECT * FROM port_manager WHERE id = 1"
    );

    let nextPort = 3003;
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
      if (occupiedPorts.length > 0) {
        nextPort = Math.max(...occupiedPorts, 3002) + 1;
      }
    }

    // 3. Verificar si el usuario ya existe
    const [existing] = await connection.execute(
      "SELECT id FROM restaurants WHERE email = ?",
      ["admin@mesacloud.com"]
    );

    if (existing.length > 0) {
      console.log("⚠️  Usuario admin@mesacloud.com ya existe, actualizando...");
      await connection.execute(
        `UPDATE restaurants SET 
          nombre = ?,
          password = ?,
          telefono = ?,
          direccion = ?,
          puerto = ?,
          subdominio = ?,
          logo_url = ?,
          imagen_url = ?,
          background_url = ?,
          carrusel_images = ?,
          divisa = ?,
          activo = true
        WHERE email = ?`,
        [
          "MesaCloud Demo",
          "admin123", // Password en texto plano (el sistema lo maneja así)
          "70123456",
          "Av. Principal 100",
          nextPort,
          "mesacloud-demo",
          "https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=Logo",
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
          "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920",
          JSON.stringify([
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"
          ]),
          "BS",
          "admin@mesacloud.com"
        ]
      );
    } else {
      console.log("📝 Creando usuario de prueba...");
      await connection.execute(
        `INSERT INTO restaurants (
          nombre, email, password, telefono, direccion, 
          puerto, subdominio, activo,
          logo_url, imagen_url, background_url, carrusel_images, divisa
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "MesaCloud Demo",
          "admin@mesacloud.com",
          "admin123",
          "70123456",
          "Av. Principal 100",
          nextPort,
          "mesacloud-demo",
          true,
          "https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=Logo",
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
          "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920",
          JSON.stringify([
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"
          ]),
          "BS"
        ]
      );
    }

    // 4. Actualizar port_manager
    const [currentPorts] = await connection.execute(
      "SELECT puertos_ocupados FROM port_manager WHERE id = 1"
    );
    let occupiedPorts = [];
    if (currentPorts.length > 0 && currentPorts[0].puertos_ocupados) {
      try {
        const portsData = currentPorts[0].puertos_ocupados;
        occupiedPorts = typeof portsData === 'string' ? JSON.parse(portsData) : portsData;
      } catch (e) {
        occupiedPorts = [];
      }
    }
    if (!occupiedPorts.includes(nextPort)) {
      occupiedPorts.push(nextPort);
    }
    await connection.execute(
      "UPDATE port_manager SET puerto_actual = ?, puertos_ocupados = ? WHERE id = 1",
      [nextPort, JSON.stringify(occupiedPorts)]
    );

    // 5. Mostrar credenciales
    const [user] = await connection.execute(
      "SELECT email, password, puerto, subdominio FROM restaurants WHERE email = ?",
      ["admin@mesacloud.com"]
    );

    await connection.end();

    console.log("\n✅ Usuario de prueba configurado exitosamente!\n");
    console.log("🔑 CREDENCIALES DE ACCESO:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📧 Email:    ${user[0].email}`);
    console.log(`🔐 Password: ${user[0].password}`);
    console.log(`🔌 Puerto:   ${user[0].puerto}`);
    console.log(`🌐 URL:      http://localhost:${user[0].puerto}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupUserAndImages();
}

module.exports = { setupUserAndImages };