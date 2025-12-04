const express = require("express");
const router = express.Router();
const fs = require("fs-extra");

const PRODUCTS_FILE = "./data/products.json";

// GET ALL PRODUCTS
router.get("/products", async (req, res) => {
  const products = await fs.readJSON(PRODUCTS_FILE);
  res.json(products);
});

module.exports = router;
