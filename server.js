import express from "express";
import fs from "fs";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Utility read/write JSON
function readJSON(path) {
    return JSON.parse(fs.readFileSync(path));
}

function writeJSON(path, data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

// File paths
const USERS = "./data/users.json";
const PRODUCTS = "./data/products.json";
const CART = "./data/transactions.json";
const ORDERS = "./data/orders.json";

// --- AUTH ---
app.post("/auth/login", (req, res) => {
    const { username, password } = req.body;
    const users = readJSON(USERS);

    const found = users.find(
        u => u.username === username && u.password === password
    );

    if (!found) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
        message: "Login success",
        role: found.role,
        username: found.username
    });
});

app.post("/auth/register", (req, res) => {
    let users = readJSON(USERS);
    const { username, password } = req.body;

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ message: "User already exists" });
    }

    users.push({
        username,
        password,
        role: "user"
    });

    writeJSON(USERS, users);
    res.json({ message: "Registration success" });
});

// --- PRODUCTS ---
app.get("/products", (req, res) => {
    res.json(readJSON(PRODUCTS));
});

app.post("/products/updateStock", (req, res) => {
    let data = readJSON(PRODUCTS);
    const { id, newStock } = req.body;

    const item = data.find(p => p.id === id);
    if (!item) return res.status(404).json({ message: "Product not found" });

    item.stock = newStock;
    writeJSON(PRODUCTS, data);

    res.json({ message: "Stock updated" });
});

app.post("/products/add", (req, res) => {
    let data = readJSON(PRODUCTS);
    const { name, price, stock } = req.body;

    data.push({
        id: Date.now(),
        name,
        price,
        stock
    });

    writeJSON(PRODUCTS, data);

    res.json({ message: "Product added" });
});

// --- CART / TRANSACTION ---
app.post("/cart/checkout", (req, res) => {
    const { username, cart } = req.body;

    let products = readJSON(PRODUCTS);
    let transactions = readJSON(CART);
    let orders = readJSON(ORDERS);

    // reduce stock
    cart.forEach(item => {
        const p = products.find(pr => pr.id === item.id);
        if (p) p.stock -= item.qty;
    });

    writeJSON(PRODUCTS, products);

    const orderID = Date.now();

    // Save purchase
    transactions.push({
        id: orderID,
        username,
        items: cart,
        status: "Processing",
        date: new Date().toISOString()
    });
    writeJSON(CART, transactions);

    // Save order tracking
    orders.push({
        id: orderID,
        username,
        status: "Processing",
        history: [
            { status: "Processing", date: new Date().toISOString() }
        ]
    });
    writeJSON(ORDERS, orders);

    res.json({ message: "Order created", orderID });
});

// --- ORDER STATUS ADMIN ---
app.get("/admin/orders", (req, res) => {
    res.json(readJSON(CART));
});

app.post("/admin/orders/updateStatus", (req, res) => {
    const { id, newStatus } = req.body;
    let transactions = readJSON(CART);
    let orders = readJSON(ORDERS);

    const order = transactions.find(o => o.id === id);
    const track = orders.find(o => o.id === id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = newStatus;
    writeJSON(CART, transactions);

    track.status = newStatus;
    track.history.push({ status: newStatus, date: new Date().toISOString() });
    writeJSON(ORDERS, orders);

    res.json({ message: "Order status updated" });
});

app.listen(PORT, () => console.log("Backend running on port " + PORT));
