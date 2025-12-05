const { readJSON, writeJSON } = require("../utils/fileManager");
const { v4: uuidv4 } = require("uuid");

function login(req, res) {
  const { username, password, role } = req.body;

  const users = readJSON("users.json");
  // try to find exact match (username/password). role parameter optional — but we'll still check username/password.
  const found = users.find(u => u.username === username && u.password === password);

  if (!found) {
    return res.json({ success: false, message: "Invalid credentials" });
  }

  // create a simple token for demo
  const token = uuidv4();

  // optional: store active sessions (not required for demo). We'll return token + role.
  res.json({
    success: true,
    token,
    username: found.username,
    role: found.role || (found.username === "admin" ? "admin" : "user")
  });
}

module.exports = { login };
