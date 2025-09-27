const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tech_ecolab',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Sessions (MemoryStore acceptable for prototype)
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 4 }
}));

// Static with cache headers
app.use(express.static('public', {
  setHeaders(res, p) {
    if (p.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// Routes
// Products list with simple pagination and optional price filter
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, sort = 'name', page = 1, limit = 100, minPrice, maxPrice } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND category_id = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (minPrice) {
      paramCount++; params.push(minPrice);
      query += ` AND price >= $${paramCount}`;
    }
    if (maxPrice) {
      paramCount++; params.push(maxPrice);
      query += ` AND price <= $${paramCount}`;
    }

    // Add sorting
    const validSorts = ['name', 'price', 'created_at'];
    const sortOrder = sort.startsWith('-') ? 'DESC' : 'ASC';
    const sortField = sort.replace('-', '');
    
    if (validSorts.includes(sortField)) {
      query += ` ORDER BY ${sortField} ${sortOrder}`;
    } else {
      query += ' ORDER BY name ASC';
    }

    // Pagination
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const pageLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const offset = (pageNum - 1) * pageLimit;
    query += ` LIMIT ${pageLimit} OFFSET ${offset}`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// --- Auth routes ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
  try {
    const r = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    if (r.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const admin = r.rows[0];
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    req.session.adminId = admin.id;
    res.json({ id: admin.id, username: admin.username });
  } catch (e) {
    console.error('Login error', e);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.adminId) return res.status(401).json({ error: 'Unauthenticated' });
  res.json({ id: req.session.adminId });
});

function requireAdmin(req, res, next) {
  if (!req.session.adminId) return res.status(401).json({ error: 'Unauthenticated' });
  next();
}

// --- Product CRUD (protected) ---
app.post('/api/products', requireAdmin, async (req, res) => {
  const { name, description, price, category_id, stock_quantity = 0, image_url, specifications } = req.body;
  try {
    const r = await pool.query(
      'INSERT INTO products(name, description, price, category_id, stock_quantity, image_url, specifications) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [name, description, price, category_id, stock_quantity, image_url || null, specifications || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error('Create product error', e);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category_id, stock_quantity, image_url, specifications } = req.body;
  try {
    const r = await pool.query(
      'UPDATE products SET name=$1, description=$2, price=$3, category_id=$4, stock_quantity=$5, image_url=$6, specifications=$7, updated_at=NOW() WHERE id=$8 RETURNING *',
      [name, description, price, category_id, stock_quantity, image_url || null, specifications || null, id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) {
    console.error('Update product error', e);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const r = await pool.query('DELETE FROM products WHERE id=$1', [id]);
    res.json({ ok: true, deleted: r.rowCount });
  } catch (e) {
    console.error('Delete product error', e);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
