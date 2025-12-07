const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Config endpoint pendiente de implementación" });
});

module.exports = router;


