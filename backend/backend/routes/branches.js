const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, nombre FROM branches");
    if (!rows) {
      return res.status(404).send({ error: "No se encontraron sucursales" });
    }
    res.send(rows);
  } catch (err) {
    console.error("Error al obtener sucursales:", err);
    res.status(500).send({
      error: "Error al obtener sucursales",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

// Obtener una sucursal por ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT nombre FROM branches WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0)
      return res.status(404).send({ error: "Sucursal no encontrada" });
    res.send(rows[0]);
  } catch (err) {
    console.error("Error al obtener la sucursal:", err);
    res.status(500).send({
      error: "Error al obtener la sucursal",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

module.exports = router;
