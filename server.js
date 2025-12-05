const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, "data");
const USERS = path.join(DATA_DIR, "users.json");
const PRODUCTS = path.join(DATA_DIR, "products.json");
const TRANSACTIONS = path.join(DATA_DIR, "transactions.json");

// Helper
function read(file) {
  return JSON.parse(fs.readFileSync(file));
}
function save(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// =====================
//   AUTH
// =====================
app.post("/auth/login", (req, res) => {
  const { username, password } = req.body;
  const users = read(USERS);

  const found = users.find(u => u.username === username && u.password === password);

  if (!found) return res.json({ success: false, message: "Invalid credentials" });

  return res.json({
    success: true,
    user: { id: found.id, username: found.username, role: found.role }
  });
});


// =====================
//   PRODUCTS
// =====================
app.get("/products", (req, res) => {
  res.json(read(PRODUCTS));
});

// Update stock (admin only)
app.post("/products/update", (req, res) => {
  const { id, stock } = req.body;
  const products = read(PRODUCTS);

  const p = products.find(x => x.id === id);
  if (!p) return res.status(404).json({ success: false });

  p.stock = stock;
  save(PRODUCTS, products);

  res.json({ success: true, product: p });
});


// =====================
//   CHECKOUT
// =====================
app.post("/checkout", (req, res) => {
  const { userId, cart } = req.body;

  const products = read(PRODUCTS);
  const transactions = read(TRANSACTIONS);

  let total = 0;

  for (let item of cart) {
    const prod = products.find(p => p.id === item.id);
    if (!prod) return res.status(404).json({ success: false });

    if (prod.stock < item.qty)
      return res.json({ success: false, message: `Stock kurang untuk ${prod.name}` });

    prod.stock -= item.qty;
    total += prod.price * item.qty;
  }

  save(PRODUCTS, products);

  const trx = {
    id: uuidv4(),
    userId,
    cart,
    total,
    date: new Date().toISOString()
  };

  transactions.push(trx);
  save(TRANSACTIONS, transactions);

  res.json({ success: true, transaction: trx });
});


// =====================
//   TRANSACTION SUMMARY
// =====================
app.get("/admin/income", (req, res) => {
  const trx = read(TRANSACTIONS);
  const total = trx.reduce((a, b) => a + b.total, 0);

  res.json({ success: true, income: total, transactions: trx });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Backend running on port", PORT));
