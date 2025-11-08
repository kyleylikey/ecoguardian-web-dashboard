const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  console.log("📡 Received POST from ChirpStack:");
  console.log(JSON.stringify(req.body, null, 2));

  // Respond back with confirmation
  res.json({
    ok: true,
    message: "Data received successfully",
    received: req.body
  });
});

module.exports = router;
