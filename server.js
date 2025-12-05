const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Mount routes
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/transactions", transactionRoutes);

// Health
app.get("/", (_, res) => res.send("ATK Backend OK"));

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Backend running on port", PORT));
