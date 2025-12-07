const { updateDatabase } = require("./update-database");
const { setupMultiTenancy } = require("./setup-multitenancy");

async function completeSetup() {
  console.log("🚀 Configuración Completa del Sistema Multi-Tenancy\n");

  try {
    // Paso 1: Actualizar base de datos
    console.log("📊 PASO 1: Actualizando base de datos...");
    await updateDatabase();
    console.log("✅ Base de datos actualizada\n");

    // Paso 2: Verificar configuración
    console.log("🔍 PASO 2: Verificando configuración...");
    await setupMultiTenancy();
    console.log("✅ Configuración verificada\n");

    // Paso 3: Instrucciones finales
    console.log("🎉 ¡Configuración completada exitosamente!\n");
    console.log("📋 Próximos pasos:");
    console.log("   1. Configurar DNS local (ver setup-dns.md)");
    console.log("   2. Iniciar servidor maestro: npm start");
    console.log(
      "   3. Acceder al panel de control: http://localhost:3000/master"
    );
    console.log(
      "   4. Iniciar frontend cliente: cd ../front_cliente/front_cliente && npm run dev"
    );
    console.log("\n🔗 URLs del sistema:");
    console.log("   - Panel de Control: http://localhost:3000/master");
    console.log("   - Frontend Cliente: http://localhost:5173");
    console.log("   - Gus Restaurant: http://gus-main.localhost:5173");
    console.log("   - Pizza Palace: http://pizza-palace.localhost:5173");
  } catch (error) {
    console.error("❌ Error durante la configuración:", error);
    console.log("\n💡 Soluciones posibles:");
    console.log("   - Verifica que MySQL esté ejecutándose");
    console.log("   - Verifica las credenciales de la base de datos");
    console.log("   - Ejecuta los scripts individualmente si es necesario");
  }
}

// Ejecutar configuración completa
if (require.main === module) {
  completeSetup();
}

module.exports = { completeSetup };
