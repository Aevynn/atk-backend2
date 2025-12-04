// routes/products.js

import express from "express";
import { products } from "../data.js";

const router = express.Router();

// GET semua produk
router.get("/", (req, res) => {
  res.json(products);
});

// GET detail produk
router.get("/:id", (req, res) => {
  const product = products.find(p => p.id == req.params.id);
  if (!product) return res.status(404).json({ message: "Produk tidak ditemukan" });
  res.json(product);
});

// POST tambah produk
router.post("/", (req, res) => {
  const newItem = {
    id: products.length + 1,
    name: req.body.name,
    price: req.body.price,
    image: req.body.image
  };
  products.push(newItem);
  res.json({ message: "Produk ditambahkan", data: newItem });
});

// DELETE produk
router.delete("/:id", (req, res) => {
  const index = products.findIndex(p => p.id == req.params.id);
  if (index === -1) return res.status(404).json({ message: "Produk tidak ditemukan" });

  const removed = products.splice(index, 1);
  res.json({ message: "Produk dihapus", removed });
});

export default router;
