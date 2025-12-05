const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = "./data.json";

function loadDB() {
  return fs.readJsonSync(DATA_FILE);
}
function saveDB(data) {
  fs.writeJsonSync(DATA_FILE, data, { spaces: 2 });
}

/* GET PRODUCTS */
app.get("/products", (req, res) => {
  const db = loadDB();
  res.json(db.products);
});

/* GET CART */
app.get("/cart", (req, res) => {
  const db = loadDB();
  res.json(db.cart);
});

/* UPDATE STOCK */
app.patch("/update-stock", (req, res) => {
  const db = loadDB();
  const { id, stock } = req.body;

  const product = db.products.find(p => p.id === id);
  if (!product) return res.status(404).json({ error: "Not found" });

  product.stock = stock;
  saveDB(db);

  res.json({ success: true });
});

/* SERVER LISTEN */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Backend running on port " + PORT));
