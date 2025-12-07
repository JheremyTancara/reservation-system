const axios = require("axios");

const API_URL = "http://localhost:3000/api";

async function testAPI() {
  console.log("🔍 Probando rutas de la API...");

  try {
    // Probar ruta de branches
    console.log("\n📊 Probando /api/branches...");
    const branchesResponse = await axios.get(`${API_URL}/branches`);
    console.log("✅ Branches:", branchesResponse.data.length, "encontrados");
    console.log("Primer branch:", branchesResponse.data[0]);

    // Probar ruta de categorías
    console.log("\n📊 Probando /api/categorias...");
    const categoriasResponse = await axios.get(`${API_URL}/categorias`);
    console.log(
      "✅ Categorías:",
      categoriasResponse.data.length,
      "encontradas"
    );

    // Probar ruta de menú para branch 1
    console.log("\n📊 Probando /api/menu/1...");
    const menuResponse = await axios.get(`${API_URL}/menu/1`);
    console.log("✅ Items de menú:", menuResponse.data.length, "encontrados");

    // Probar ruta de mesas para branch 1
    console.log("\n📊 Probando /api/mesas/1...");
    const mesasResponse = await axios.get(`${API_URL}/mesas/1`);
    console.log("✅ Mesas:", mesasResponse.data.length, "encontradas");

    console.log("\n✅ Todas las rutas de la API funcionan correctamente");
  } catch (error) {
    console.error("❌ Error en la API:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.log("💡 El servidor no está ejecutándose. Ejecuta: npm start");
    } else if (error.response) {
      console.log(
        "💡 Error del servidor:",
        error.response.status,
        error.response.data
      );
    }
  }
}

testAPI();
