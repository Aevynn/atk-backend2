const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/", authRoutes);
app.use("/", productRoutes);
app.use("/", cartRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Backend berjalan di port " + PORT);
});
