const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Helper functions
function readJSON(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "data", name)));
}
function writeJSON(name, data) {
  fs.writeFileSync(path.join(__dirname, "data", name), JSON.stringify(data, null, 2));
}

// ------------------------ AUTH ------------------------
app.post("/auth/login", (req, res) => {
  const { username, password } = req.body;
  const users = readJSON("users.json");

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  res.json({
    message: "Login success",
    username: user.username,
    role: user.role
  });
});

app.post("/auth/register", (req, res) => {
  const users = readJSON("users.json");
  const { username, password } = req.body;

  if (users.find(u => u.username === username))
    return res.status(400).json({ message: "Username already exists" });

  users.push({ username, password, role: "user" });
  writeJSON("users.json", users);

  res.json({ message: "Registration successful" });
});

// ------------------------ PRODUCTS ------------------------
app.get("/products", (req, res) => {
  res.json(readJSON("products.json"));
});

app.post("/products/update-stock", (req, res) => {
  const { productId, newStock } = req.body;

  let products = readJSON("products.json");
  const p = products.find(pr => pr.id === productId);

  if (!p) return res.status(404).json({ message: "Product not found" });

  p.stock = newStock;
  writeJSON("products.json", products);

  res.json({ message: "Stock updated", p });
});

// ------------------------ CHECKOUT ------------------------
app.post("/checkout", (req, res) => {
  const { items, username } = req.body;

  let products = readJSON("products.json");
  let transactions = readJSON("transactions.json");

  let total = 0;

  for (let item of items) {
    const product = products.find(p => p.id === item.productId);

    if (!product) return res.status(404).json({ message: "Product missing" });
    if (product.stock < item.qty)
      return res.status(400).json({ message: "Insufficient stock" });

    product.stock -= item.qty;
    total += product.price * item.qty;
  }

  writeJSON("products.json", products);

  const trx = {
    id: Date.now(),
    username,
    items,
    total,
    date: new Date().toISOString()
  };

  transactions.push(trx);
  writeJSON("transactions.json", transactions);

  res.json({ message: "Checkout success", trx });
});

// ------------------------------------------------------------

app.get("/", (req, res) => {
  res.send("ATK Backend is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
