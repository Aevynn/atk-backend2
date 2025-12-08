const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());

// CORS lebih aman tapi tetap bebas untuk development
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
}));

const DATA_DIR = path.join(__dirname, 'data');
const USERS_F = path.join(DATA_DIR, 'users.json');
const PRODUCTS_F = path.join(DATA_DIR, 'products.json');
const TRANSACTIONS_F = path.join(DATA_DIR, 'transactions.json');

// Utility
function readJSON(file) {
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw || "[]");
  } catch (e) {
    return [];
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

/* ============================
   AUTH (tanpa perubahan besar)
=============================== */

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ success: false, message: "Missing username/password" });

  const users = readJSON(USERS_F);
  const user = users.find(u => u.username === username && u.password === password);

  if (!user)
    return res.status(401).json({ success: false, message: 'Invalid credentials' });

  return res.json({
    success: true,
    user: { id: user.id, username: user.username, role: user.role }
  });
});

app.post('/auth/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ success: false, message: 'Missing username/password' });

  const users = readJSON(USERS_F);

  if (users.some(u => u.username === username))
    return res.status(400).json({ success: false, message: 'Username already exists' });

  const newUser = {
    id: Date.now(),
    username,
    password,
    role: 'user'
  };

  users.push(newUser);
  writeJSON(USERS_F, users);

  return res.json({
    success: true,
    user: { id: newUser.id, username: newUser.username, role: newUser.role }
  });
});

/* ============================
   PRODUCTS
=============================== */

app.get('/products', (req, res) => {
  const products = readJSON(PRODUCTS_F);
  res.json(products);
});

app.post('/products/add', (req, res) => {
  const { name, price, stock } = req.body;

  if (!name || price == null)
    return res.status(400).json({ success: false, message: 'Missing name or price' });

  const products = readJSON(PRODUCTS_F);

  const newProduct = {
    id: Date.now(),
    name,
    price: Number(price),
    stock: Number(stock || 0)
  };

  products.push(newProduct);
  writeJSON(PRODUCTS_F, products);

  res.json({ success: true, product: newProduct });
});

app.post('/products/update', (req, res) => {
  const { id, stock } = req.body;

  if (!id || stock == null)
    return res.status(400).json({ success: false, message: "Missing id or stock" });

  const products = readJSON(PRODUCTS_F);
  const product = products.find(p => Number(p.id) === Number(id));

  if (!product)
    return res.status(404).json({ success: false, message: "Product not found" });

  product.stock = Math.max(0, Number(stock)); // tidak boleh minus

  writeJSON(PRODUCTS_F, products);
  res.json({ success: true, product });
});

/* ============================
   CHECKOUT (stabil + validasi)
=============================== */

app.post('/checkout', (req, res) => {
  try {
    const { username, cart } = req.body;

    if (!username || !Array.isArray(cart) || cart.length === 0)
      return res.status(400).json({ success: false, message: "Invalid cart/username" });

    const products = readJSON(PRODUCTS_F);

    let total = 0;

    // Validate
    for (const item of cart) {
      if (!item.id || !item.qty)
        return res.status(400).json({ success: false, message: "Invalid cart structure" });

      const product = products.find(p => Number(p.id) === Number(item.id));
      if (!product)
        return res.status(404).json({ success: false, message: `Product ${item.id} not found` });

      if (product.stock < item.qty)
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
    }

    // Compute & reduce stock
    for (const item of cart) {
      const product = products.find(p => Number(p.id) === Number(item.id));
      product.stock -= item.qty;
      total += product.price * item.qty;
    }

    writeJSON(PRODUCTS_F, products);

    // Save transaction
    const transactions = readJSON(TRANSACTIONS_F);
    const newTransaction = {
      id: "T-" + Date.now(),
      username,
      cart,
      total,
      status: "Processing",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    transactions.push(newTransaction);
    writeJSON(TRANSACTIONS_F, transactions);

    res.json({ success: true, transaction: newTransaction });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================
   TRANSACTIONS
=============================== */

app.get('/transactions', (req, res) => {
  const transactions = readJSON(TRANSACTIONS_F);
  res.json(transactions);
});

app.post('/transactions/update', (req, res) => {
  const { id, status } = req.body;

  if (!id || !status)
    return res.status(400).json({ success: false, message: "Missing id or status" });

  const transactions = readJSON(TRANSACTIONS_F);
  const trx = transactions.find(t => t.id === id);

  if (!trx)
    return res.status(404).json({ success: false, message: "Transaction not found" });

  if (trx.status.toLowerCase() === "completed")
    return res.status(400).json({ success: false, message: "Cannot modify completed transaction" });

  // update
  trx.status = status;
  trx.updatedAt = new Date().toISOString();

  trx.history = trx.history || [];
  trx.history.push({ status, date: trx.updatedAt });

  writeJSON(TRANSACTIONS_F, transactions);

  res.json({ success: true, transaction: trx });
});

/* ============================
   HEALTHCHECK
=============================== */

app.get('/', (req, res) => res.send("ATK backend OK"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));
