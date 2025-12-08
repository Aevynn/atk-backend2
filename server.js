const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const USERS_F = path.join(DATA_DIR, 'users.json');
const PRODUCTS_F = path.join(DATA_DIR, 'products.json');
const TRANSACTIONS_F = path.join(DATA_DIR, 'transactions.json');

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return [];
  }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// --- AUTH ---
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  const users = readJSON(USERS_F);
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  return res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
});

app.post('/auth/register', (req, res) => {
  const { username, password } = req.body;
  const users = readJSON(USERS_F);
  if (users.find(u => u.username === username)) return res.status(400).json({ success: false, message: 'Username exists' });
  const newUser = { id: Date.now(), username, password, role: 'user' };
  users.push(newUser);
  writeJSON(USERS_F, users);
  res.json({ success: true, user: { id: newUser.id, username: newUser.username, role: newUser.role } });
});

// --- PRODUCTS ---
app.get('/products', (req, res) => {
  const products = readJSON(PRODUCTS_F);
  res.json(products);
});

app.post('/products/add', (req, res) => {
  const { name, price, stock } = req.body;
  const products = readJSON(PRODUCTS_F);
  const newP = { id: Date.now(), name, price: Number(price), stock: Number(stock || 0) };
  products.push(newP);
  writeJSON(PRODUCTS_F, products);
  res.json({ success: true, product: newP });
});

app.post('/products/update', (req, res) => {
  const { id, stock } = req.body;
  const products = readJSON(PRODUCTS_F);
  const p = products.find(x => Number(x.id) === Number(id));
  if (!p) return res.status(404).json({ success: false, message: 'Product not found' });
  p.stock = Number(stock);
  writeJSON(PRODUCTS_F, products);
  res.json({ success: true, product: p });
});

// --- CHECKOUT / CREATE TRANSACTION ---
app.post('/checkout', (req, res) => {
  try {
    const { username, cart } = req.body;
    if (!cart || !Array.isArray(cart) || cart.length === 0) return res.status(400).json({ success: false, message: 'Cart empty' });

    const products = readJSON(PRODUCTS_F);
    // validate and compute total
    let total = 0;
    for (const item of cart) {
      const p = products.find(pr => Number(pr.id) === Number(item.id));
      if (!p) return res.status(404).json({ success: false, message: `Product ${item.id} not found` });
      if (p.stock < item.qty) return res.status(400).json({ success: false, message: `Insufficient stock for ${p.name}` });
    }

    // reduce stock and compute total
    for (const item of cart) {
      const p = products.find(pr => Number(pr.id) === Number(item.id));
      p.stock -= item.qty;
      total += p.price * item.qty;
    }
    writeJSON(PRODUCTS_F, products);

    // save transaction
    const transactions = readJSON(TRANSACTIONS_F);
    const newTrx = {
      id: 'T-' + Date.now(),
      username,
      cart,
      total,
      status: 'Processing',
      createdAt: new Date().toISOString()
    };
    transactions.push(newTrx);
    writeJSON(TRANSACTIONS_F, transactions);

    return res.json({ success: true, transaction: newTrx });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --- GET TRANSACTIONS (admin & client see all; client will filter by username) ---
app.get('/transactions', (req, res) => {
  const transactions = readJSON(TRANSACTIONS_F);
  res.json(transactions);
});

// --- ADMIN: update transaction status ---
app.post('/transactions/update', (req, res) => {
  const { id, status } = req.body;
  const transactions = readJSON(TRANSACTIONS_F);
  const t = transactions.find(x => x.id === id);
  if (!t) return res.status(404).json({ success: false, message: 'Transaction not found' });
  if (t.status === 'Completed' || t.status === 'completed') {
    return res.status(400).json({ success: false, message: 'Cannot modify completed transaction' });
  }
  t.status = status;
  // append history (optional)
  t.history = t.history || [];
  t.history.push({ status, date: new Date().toISOString() });
  writeJSON(TRANSACTIONS_F, transactions);
  res.json({ success: true, transaction: t });
});

// Health
app.get('/', (req, res) => res.send('ATK backend OK'));

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));
