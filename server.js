// server.js

import express from "express";
import cors from "cors";
import productRoutes from "./routes/products.js";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/products", productRoutes);

// Root
app.get("/", (req, res) => {
  res.send("Backend ATK (No Database) Online");
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
