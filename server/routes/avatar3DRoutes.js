const express = require("express");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "3D avatar service is running" });
});

module.exports = router;
