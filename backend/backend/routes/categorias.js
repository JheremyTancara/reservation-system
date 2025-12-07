const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Obtener todas las categorías (son globales para todos los branches)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM categorias");
    res.json(rows);
  } catch (err) {
    console.error("Error al obtener categorías:", err);
    res.status(500).send({ error: "Error al obtener categorías" });
  }
});

// Obtener categorías por branch (opcional, para futuras implementaciones)
router.get("/:branch_id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM categorias");
    res.json(rows);
  } catch (err) {
    console.error("Error al obtener categorías:", err);
    res.status(500).send({ error: "Error al obtener categorías" });
  }
});

// Crear nueva categoría
router.post("/", async (req, res) => {
  try {
    const { nombre } = req.body;
    await db.query("INSERT INTO categorias (nombre) VALUES (?)", [nombre]);
    res.send({ msg: "Categoría creada" });
  } catch (err) {
    console.error("Error al crear categoría:", err);
    res.status(500).send({ error: "Error al crear categoría" });
  }
});

module.exports = router;
