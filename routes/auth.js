const express = require("express");
const router = express.Router();
const fs = require("fs-extra");

const USERS_FILE = "./data/users.json";

// LOGIN
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const users = await fs.readJSON(USERS_FILE);

  const found = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!found) return res.status(401).json({ message: "Login gagal" });

  return res.json({ message: "Login berhasil", token: "dummy-token" });
});

module.exports = router;
