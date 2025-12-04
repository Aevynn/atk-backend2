const express = require("express");
const router = express.Router();
const fs = require("fs-extra");

const CART_FILE = "./data/cart.json";
const PRODUCTS_FILE = "./data/products.json";

// ADD TO CART
router.post("/cart/add", async (req, res) => {
  const { productId } = req.body;

  const cart = await fs.readJSON(CART_FILE);
  const products = await fs.readJSON(PRODUCTS_FILE);

  const product = products.find((p) => p.id === productId);

  if (!product) return res.status(404).json({ message: "Produk tidak ditemukan" });

  if (product.stock <= 0)
    return res.status(400).json({ message: "Stok habis" });

  // kurangi stok
  product.stock--;

  // push ke cart
  cart.push({
    productId,
    date: new Date().toISOString()
  });

  await fs.writeJSON(PRODUCTS_FILE, products, { spaces: 2 });
  await fs.writeJSON(CART_FILE, cart, { spaces: 2 });

  res.json({ message: "Ditambahkan ke keranjang" });
});

module.exports = router;
