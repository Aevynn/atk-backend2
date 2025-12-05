import express from "express";
import cors from "cors";
import fs from "fs-extra";

const app = express();
app.use(cors());
app.use(express.json());

const DB_PATH = "./db.json";

// Load database
const loadDB = async () => await fs.readJson(DB_PATH);

// Save database
const saveDB = async (data) => await fs.writeJson(DB_PATH, data, { spaces: 2 });

// ===========================
// LOGIN
// ===========================
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const db = await loadDB();

  const user = db.users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  res.json({ role: user.role, username: user.username });
});

// ===========================
// GET PRODUCTS
// ===========================
app.get("/products", async (_, res) => {
  const db = await loadDB();
  res.json(db.products);
});

// ===========================
// UPDATE STOCK (ADMIN)
// ===========================
app.post("/admin/update", async (req, res) => {
  const { id, stock } = req.body;

  const db = await loadDB();
  const product = db.products.find((p) => p.id === id);

  if (!product) return res.status(404).json({ message: "Not found" });

  product.stock = stock;
  await saveDB(db);

  res.json({ message: "Stock updated", product });
});

// ===========================
// CHECKOUT (USER)
// ===========================
app.post("/checkout", async (req, res) => {
  const cart = req.body;

  const db = await loadDB();

  for (let item of cart) {
    const p = db.products.find((prod) => prod.id === item.id);

    if (!p || p.stock < item.qty) {
      return res.status(400).json({
        message: `Stock tidak cukup: ${p?.name || "Unknown"}`
      });
    }

    p.stock -= item.qty;
  }

  await saveDB(db);
  res.json({ message: "Checkout berhasil" });
});

// ===========================
app.get("/", (_, res) => res.send("ATK Backend OK"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Backend running on port " + PORT));
