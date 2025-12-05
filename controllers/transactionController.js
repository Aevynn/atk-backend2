const { readJSON, writeJSON } = require("../utils/fileManager");

function checkout(req, res) {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "Cart empty or invalid" });
  }

  const products = readJSON("products.json");
  const transactions = readJSON("transactions.json");

  // validate and calculate total
  let total = 0;
  for (const it of items) {
    const prod = products.find(p => Number(p.id) === Number(it.id));
    if (!prod) {
      return res.status(400).json({ success: false, message: `Product id ${it.id} not found` });
    }
    if (prod.stock < it.qty) {
      return res.status(400).json({ success: false, message: `Insufficient stock for ${prod.name}` });
    }
    total += prod.price * it.qty;
  }

  // decrement stock
  for (const it of items) {
    const prod = products.find(p => Number(p.id) === Number(it.id));
    prod.stock = prod.stock - it.qty;
  }

  // write products back
  writeJSON("products.json", products);

  // create transaction
  const tx = {
    id: Date.now(),
    items,
    total,
    createdAt: new Date().toISOString()
  };

  transactions.push(tx);
  writeJSON("transactions.json", transactions);

  res.json({ success: true, transaction: tx });
}

function getIncome(req, res) {
  const transactions = readJSON("transactions.json");
  const total = transactions.reduce((s, t) => s + (t.total || 0), 0);
  res.json({ success: true, total });
}

module.exports = { checkout, getIncome };
