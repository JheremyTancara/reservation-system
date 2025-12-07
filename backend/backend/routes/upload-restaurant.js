const express = require("express");

const router = express.Router();

router.post("/", (req, res) => {
  res.status(501).json({ error: "Upload restaurant pendiente de implementación" });
});

module.exports = router;


