const express = require("express");
const router = express.Router();
const { checkout, getIncome } = require("../controllers/transactionController");

// POST /transactions/checkout
router.post("/checkout", checkout);

// GET /transactions/income
router.get("/income", getIncome);

module.exports = router;
