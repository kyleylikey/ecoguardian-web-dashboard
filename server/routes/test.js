const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Test route working!" });
});

router.get("/ping", (req, res) => {
  res.json({ message: "pong 🏓" });
});

module.exports = router;
