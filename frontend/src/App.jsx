import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "/api/products";
const emptyForm = { sku: "", name: "", category: "Electronics", quantity: "", price: "" };

function App() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchProducts() {
    try {
      setError("");
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Products could not be loaded. Check the API and database.");
      setProducts(await response.json());
    } catch (err) {
      setError(err.message || "Could not connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchProducts(); }, []);

  const filteredProducts = useMemo(() => products.filter((product) => {
    const query = search.toLowerCase();
    const matchesSearch = `${product.sku} ${product.name} ${product.category}`.toLowerCase().includes(query);
    return matchesSearch && (filter === "All" || product.stock_status === filter);
  }), [products, search, filter]);

  function openAddForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setShowForm(true);
  }

  function openEditForm(product) {
    setEditingId(product.id);
    setForm({ sku: product.sku, name: product.name, category: product.category, quantity: String(product.quantity), price: String(product.price) });
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const productData = { sku: form.sku.trim(), name: form.name.trim(), category: form.category.trim(), quantity: Number(form.quantity), price: Number(form.price) };
    if (!productData.sku || !productData.name || !productData.category || !Number.isInteger(productData.quantity) || productData.quantity < 0 || !Number.isFinite(productData.price) || productData.price <= 0) {
      setError("Enter a SKU, product name, category, whole-number quantity and price greater than zero.");
      return;
    }
    try {
      setSaving(true);
      const editing = editingId !== null;
      const response = await fetch(editing ? `${API_URL}/${editingId}` : API_URL, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Product could not be saved.");
      await fetchProducts();
      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });
    } catch (err) {
      setError(err.message || "Product could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id) {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      setError("");
      const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Product could not be deleted.");
      await fetchProducts();
    } catch (err) {
      setError(err.message || "Product could not be deleted.");
    }
  }

  const inStockCount = products.filter((p) => p.stock_status === "In Stock").length;
  const lowStockCount = products.filter((p) => p.stock_status === "Low Stock").length;
  const outOfStockCount = products.filter((p) => p.stock_status === "Out of Stock").length;
  const categoriesCount = new Set(products.map((p) => p.category)).size;
  const currency = (value) => Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand"><div className="brand-logo">I</div><span>Stock<span className="brand-light">Wise</span></span></div>
        <div className="nav-label">WORKSPACE</div>
        <button className="nav-item active"><span>▦</span> Dashboard</button>
        <button className="nav-item" onClick={() => { setFilter("All"); setMenuOpen(false); }}><span>▤</span> All Products</button>
        <button className="nav-item" onClick={() => { setFilter("In Stock"); setMenuOpen(false); }}><span>✓</span> In Stock</button>
        <button className="nav-item" onClick={() => { setFilter("Low Stock"); setMenuOpen(false); }}><span>!</span> Low Stock</button>
        <button className="nav-item" onClick={() => { setFilter("Out of Stock"); setMenuOpen(false); }}><span>◷</span> Out of Stock</button>
        <div className="nav-label settings-label">MANAGEMENT</div>
        <button className="nav-item" onClick={() => { setSearch(""); setFilter("All"); setMenuOpen(false); }}><span>⌘</span> Categories</button>
        <button className="nav-item" onClick={openAddForm}><span>＋</span> Add Product</button>
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-icon">✦</div><strong>Stock made simple</strong><p>Keep your inventory organised.</p></div>
          <div className="profile"><div className="avatar admin-avatar">AS</div><div className="profile-info"><strong>Admin User</strong><span>Administrator</span></div><span className="profile-dots">•••</span></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
          <div className="breadcrumb">Workspace <span>/</span> <strong>Inventory Dashboard</strong></div>
          <div className="topbar-right"><span className="today-label">● Inventory overview</span><button className="icon-button" title="Notifications">♧<i /></button><div className="avatar top-avatar">AS</div></div>
        </header>

        <section className="page-content">
          <div className="welcome-row"><div><div className="eyebrow">YOUR STOCK, AT A GLANCE</div><h1>Inventory Dashboard</h1><p className="subtitle">Track products, quantities and stock levels in one place.</p></div><button className="primary-button" onClick={openAddForm}><span>＋</span> Add Product</button></div>

          {error && <div role="alert" style={{ color: "#b42318", background: "#fef3f2", padding: "12px 16px", borderRadius: "8px", marginBottom: "18px" }}>{error}<button type="button" onClick={fetchProducts} style={{ marginLeft: "12px", cursor: "pointer", padding: "4px 8px" }}>Retry</button></div>}

          <section className="stats-grid">
            <article className="stat-card"><div className="stat-top"><span>Total Products</span><span className="stat-icon purple">▤</span></div><div className="stat-number">{loading ? "—" : products.length}</div><div className="stat-note"><span className="trend">↗</span> Products in catalogue</div></article>
            <article className="stat-card"><div className="stat-top"><span>In Stock</span><span className="stat-icon green">✓</span></div><div className="stat-number">{loading ? "—" : inStockCount}</div><div className="stat-note"><span className="green-text">●</span> More than 5 units</div></article>
            <article className="stat-card"><div className="stat-top"><span>Low Stock</span><span className="stat-icon orange">!</span></div><div className="stat-number">{loading ? "—" : lowStockCount}</div><div className="stat-note">5 units or fewer</div></article>
            <article className="stat-card"><div className="stat-top"><span>Categories</span><span className="stat-icon blue">⌘</span></div><div className="stat-number">{loading ? "—" : categoriesCount}</div><div className="stat-note">Product categories</div></article>
          </section>

          <section className="product-section">
            <div className="section-heading"><div><h2>Product Catalogue</h2><p>View and manage your inventory records.</p></div><button className="secondary-button" onClick={() => { setSearch(""); setFilter("All"); }}>↻ Reset</button></div>
            <div className="table-toolbar"><div className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search SKU, product or category..." />{search && <button onClick={() => setSearch("")}>×</button>}</div><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="All">All stock statuses</option><option value="In Stock">In Stock</option><option value="Low Stock">Low Stock</option><option value="Out of Stock">Out of Stock</option></select></div>
            <div className="table-wrap"><table><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>QUANTITY</th><th>UNIT PRICE</th><th>STOCK STATUS</th><th>ACTIONS</th></tr></thead><tbody>
              {loading && <tr><td colSpan="6" className="empty-state">Loading products from database...</td></tr>}
              {!loading && filteredProducts.map((product) => <tr key={product.id}>
                <td><div className="product-cell"><div className={`avatar product-avatar color-${product.id % 5}`}>{product.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</div><div className="product-info"><strong>{product.name}</strong><span>{product.sku}</span></div></div></td>
                <td><span className="department-pill">{product.category}</span></td>
                <td className="salary">{product.quantity}</td>
                <td className="salary">₹{currency(product.price)}</td>
                <td><span className={`status ${product.stock_status === "In Stock" ? "status-active" : "status-leave"}`}><i />{product.stock_status}</span></td>
                <td><div className="action-buttons"><button className="edit-button" title="Edit product" onClick={() => openEditForm(product)}>Edit</button><button className="delete-button" title="Delete product" onClick={() => deleteProduct(product.id)}>Delete</button></div></td>
              </tr>)}
              {!loading && filteredProducts.length === 0 && <tr><td colSpan="6" className="empty-state">No products found. Try another search or add a product.</td></tr>}
            </tbody></table></div>
            <div className="table-footer">Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products <span>{outOfStockCount} out of stock · Live PostgreSQL database</span></div>
          </section>
          <footer className="footer">© 2026 StockWise <span>Inventory management workspace.</span></footer>
        </section>
      </main>

      {showForm && <div className="modal-backdrop" onClick={() => !saving && setShowForm(false)}><section className="product-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading"><div><div className="eyebrow">INVENTORY MANAGEMENT</div><h2>{editingId !== null ? "Edit Product" : "Add New Product"}</h2><p>Enter the product details below.</p></div><button className="close-button" disabled={saving} onClick={() => setShowForm(false)}>×</button></div>
        <form onSubmit={handleSubmit}>
          <label>Product SKU<input required value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} placeholder="e.g. ELEC-1001" /></label>
          <label>Product Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Wireless Keyboard" /></label>
          <label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Electronics</option><option>Office Supplies</option><option>Accessories</option><option>Furniture</option><option>Home Appliances</option><option>Other</option></select></label>
          <div className="form-row"><label>Quantity<input required type="number" min="0" step="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} placeholder="e.g. 25" /></label><label>Unit Price (₹)<input required type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="e.g. 1499.00" /></label></div>
          <p className="form-hint">Stock status is calculated automatically: zero = Out of Stock, 1–5 = Low Stock, above 5 = In Stock.</p>
          {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
          <div className="modal-actions"><button type="button" className="secondary-button" disabled={saving} onClick={() => { setShowForm(false); setError(""); }}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : editingId !== null ? "Save Changes" : "Add Product"}</button></div>
        </form>
      </section></div>}
    </div>
  );
}

export default App;
