const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "inventory_db",
});

const productSelect = `
  SELECT id, sku, name, category, quantity, price, created_at, updated_at,
    CASE
      WHEN quantity = 0 THEN 'Out of Stock'
      WHEN quantity <= 5 THEN 'Low Stock'
      ELSE 'In Stock'
    END AS stock_status
  FROM products
`;

function validateProduct(body = {}) {
  const { sku, name, category, quantity, price } = body;
  const parsedQuantity = Number(quantity);
  const parsedPrice = Number(price);
  if (!sku?.trim() || !name?.trim() || !category?.trim()) {
    return "SKU, product name and category are required.";
  }
  if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
    return "Quantity must be a whole number greater than or equal to zero.";
  }
  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    return "Price must be a number greater than zero.";
  }
  return null;
}

app.get("/", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ message: "Inventory Management API is running.", database: "Connected" });
  } catch (error) {
    console.error("Database health check failed:", error.message);
    res.status(500).json({ error: "Database connection failed." });
  }
});

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

app.get("/api/products", async (_req, res) => {
  try {
    const result = await pool.query(`${productSelect} ORDER BY id DESC`);
    res.json(result.rows);
  } catch (error) {
    console.error("Fetch products error:", error.message);
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const result = await pool.query(`${productSelect} WHERE id = $1`, [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Product not found." });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Fetch product error:", error.message);
    res.status(500).json({ error: "Failed to fetch product." });
  }
});

app.post("/api/products", async (req, res) => {
  const validationError = validateProduct(req.body);
  if (validationError) return res.status(400).json({ error: validationError });
  const { sku, name, category, quantity, price } = req.body;
  try {
    const inserted = await pool.query(
      `INSERT INTO products (sku, name, category, quantity, price)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [sku.trim().toUpperCase(), name.trim(), category.trim(), Number(quantity), Number(price)]
    );
    const result = await pool.query(`${productSelect} WHERE id = $1`, [inserted.rows[0].id]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ error: "That SKU already exists. Use a unique SKU." });
    console.error("Add product error:", error.message);
    res.status(500).json({ error: "Failed to add product." });
  }
});

app.put("/api/products/:id", async (req, res) => {
  const validationError = validateProduct(req.body);
  if (validationError) return res.status(400).json({ error: validationError });
  const { sku, name, category, quantity, price } = req.body;
  try {
    const updated = await pool.query(
      `UPDATE products SET sku = $1, name = $2, category = $3,
       quantity = $4, price = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING id`,
      [sku.trim().toUpperCase(), name.trim(), category.trim(), Number(quantity), Number(price), req.params.id]
    );
    if (updated.rowCount === 0) return res.status(404).json({ error: "Product not found." });
    const result = await pool.query(`${productSelect} WHERE id = $1`, [req.params.id]);
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ error: "That SKU already exists. Use a unique SKU." });
    console.error("Update product error:", error.message);
    res.status(500).json({ error: "Failed to update product." });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING id", [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Product not found." });
    res.json({ message: "Product deleted successfully." });
  } catch (error) {
    console.error("Delete product error:", error.message);
    res.status(500).json({ error: "Failed to delete product." });
  }
});

const PORT = Number(process.env.PORT) || 5000;
const server = app.listen(PORT, () => console.log(`Inventory API listening on port ${PORT}`));

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
