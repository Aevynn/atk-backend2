// server.js — simple file-based backend
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const TRANSACTIONS_FILE = path.join(DATA_DIR, "transactions.json");

// ensure data folder and files exist
function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([
      { "id": 1, "username": "admin", "password": "admin123", "role": "admin" },
      { "id": 2, "username": "user", "password": "user123", "role": "user" }
    ], null, 2));
  }
  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify([
      { "id": 1, "name": "Pulpen Hitam", "price": 5000, "stock": 20 },
      { "id": 2, "name": "Pensil 2B", "price": 3000, "stock": 30 },
      { "id": 3, "name": "Buku Tulis", "price": 8000, "stock": 15 }
    ], null, 2));
  }
  if (!fs.existsSync(TRANSACTIONS_FILE)) {
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify([], null, 2));
  }
}
ensure();

// helpers
function read(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function write(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

// --- Health ---
app.get("/", (req, res) => res.send("ATK backend OK"));

// --- AUTH: login ---
app.post("/auth/login", (req, res) => {
  const { username, password } = req.body;
  const users = read(USERS_FILE);
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.json({ success: false, message: "Invalid credentials" });
  // return minimal user object
  res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
});

// --- PRODUCTS: list ---
app.get("/products", (req, res) => {
  const products = read(PRODUCTS_FILE);
  res.json(products);
});

// --- PRODUCTS: update stock (admin) ---
app.post("/products/update", (req, res) => {
  const { id, stock } = req.body;
  const products = read(PRODUCTS_FILE);
  const p = products.find(x => Number(x.id) === Number(id));
  if (!p) return res.status(404).json({ success: false, message: "Product not found" });
  p.stock = Number(stock);
  write(PRODUCTS_FILE, products);
  res.json({ success: true, product: p });
});

// --- CHECKOUT: reduce stock & create transaction ---
app.post("/checkout", (req, res) => {
  const { userId, cart } = req.body;
  if (!Array.isArray(cart) || cart.length === 0) return res.status(400).json({ success: false, message: "Empty cart" });

  const products = read(PRODUCTS_FILE);
  const transactions = read(TRANSACTIONS_FILE);

  // validate
  for (const item of cart) {
    const prod = products.find(p => Number(p.id) === Number(item.id));
    if (!prod) return res.status(404).json({ success: false, message: `Product ${item.id} not found` });
    if (prod.stock < item.qty) return res.status(400).json({ success: false, message: `Insufficient stock for ${prod.name}` });
  }

  // reduce stock & compute total
  let total = 0;
  for (const item of cart) {
    const prod = products.find(p => Number(p.id) === Number(item.id));
    prod.stock -= item.qty;
    total += prod.price * item.qty;
  }

  write(PRODUCTS_FILE, products);

  const trx = {
    id: uuidv4(),
    userId: userId || null,
    cart,
    total,
    createdAt: new Date().toISOString()
  };
  transactions.push(trx);
  write(TRANSACTIONS_FILE, transactions);

  res.json({ success: true, transaction: trx });
});

// --- TRANSACTIONS: list & income ---
app.get("/transactions", (req, res) => {
  const transactions = read(TRANSACTIONS_FILE);
  res.json(transactions);
});
app.get("/transactions/income", (req, res) => {
  const transactions = read(TRANSACTIONS_FILE);
  const totalIncome = transactions.reduce((s, t) => s + (t.total || 0), 0);
  res.json({ success: true, totalIncome, transactions });
});

// start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ATK backend running on port ${PORT}`));
