const express = require("express");
const router = express.Router();
const { getProducts, updateProduct } = require("../controllers/productController");

// GET /products
router.get("/", getProducts);

// PUT /products/:id  (update stok/name/price)
router.put("/:id", updateProduct);

module.exports = router;
