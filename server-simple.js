const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Load database from JSON file
let database = {};
async function loadDatabase() {
    try {
        const data = await fs.readFile('database.json', 'utf8');
        database = JSON.parse(data);
        console.log('Database loaded successfully');
    } catch (error) {
        console.error('Error loading database:', error);
        // Initialize empty database if file doesn't exist
        database = { categories: [], products: [], admins: [] };
    }
}

// Save database to JSON file
async function saveDatabase() {
    try {
        await fs.writeFile('database.json', JSON.stringify(database, null, 2));
    } catch (error) {
        console.error('Error saving database:', error);
    }
}

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
        },
    },
}));
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
        let products = [...database.products];

        // Filter by category
        if (category) {
            products = products.filter(p => p.category_id == category);
        }

        // Filter by search
        if (search) {
            const searchLower = search.toLowerCase();
            products = products.filter(p => 
                p.name.toLowerCase().includes(searchLower) || 
                p.description.toLowerCase().includes(searchLower)
            );
        }

        // Filter by price
        if (minPrice) {
            products = products.filter(p => p.price >= parseFloat(minPrice));
        }
        if (maxPrice) {
            products = products.filter(p => p.price <= parseFloat(maxPrice));
        }

        // Sort
        const validSorts = ['name', 'price', 'created_at'];
        const sortOrder = sort.startsWith('-') ? 'desc' : 'asc';
        const sortField = sort.replace('-', '');
        
        if (validSorts.includes(sortField)) {
            products.sort((a, b) => {
                let aVal = a[sortField];
                let bVal = b[sortField];
                
                if (sortField === 'price') {
                    aVal = parseFloat(aVal);
                    bVal = parseFloat(bVal);
                }
                
                if (sortOrder === 'desc') {
                    return bVal > aVal ? 1 : -1;
                } else {
                    return aVal > bVal ? 1 : -1;
                }
            });
        }

        // Pagination
        const pageNum = Math.max(parseInt(page) || 1, 1);
        const pageLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
        const offset = (pageNum - 1) * pageLimit;
        const paginatedProducts = products.slice(offset, offset + pageLimit);

        res.json(paginatedProducts);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        res.json(database.categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = database.products.find(p => p.id == id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Add category name
        const category = database.categories.find(c => c.id === product.category_id);
        const productWithCategory = {
            ...product,
            category_name: category ? category.name : 'Unknown'
        };
        
        res.json(productWithCategory);
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
        const admin = database.admins.find(a => a.username === username);
        if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
        
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
        const newId = Math.max(...database.products.map(p => p.id), 0) + 1;
        const newProduct = {
            id: newId,
            name,
            description,
            price: parseFloat(price),
            category_id: parseInt(category_id),
            stock_quantity: parseInt(stock_quantity),
            image_url: image_url || null,
            specifications: specifications || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        database.products.push(newProduct);
        await saveDatabase();
        res.status(201).json(newProduct);
    } catch (e) {
        console.error('Create product error', e);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

app.put('/api/products/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, description, price, category_id, stock_quantity, image_url, specifications } = req.body;
    
    try {
        const productIndex = database.products.findIndex(p => p.id == id);
        if (productIndex === -1) return res.status(404).json({ error: 'Not found' });
        
        database.products[productIndex] = {
            ...database.products[productIndex],
            name,
            description,
            price: parseFloat(price),
            category_id: parseInt(category_id),
            stock_quantity: parseInt(stock_quantity),
            image_url: image_url || null,
            specifications: specifications || null,
            updated_at: new Date().toISOString()
        };
        
        await saveDatabase();
        res.json(database.products[productIndex]);
    } catch (e) {
        console.error('Update product error', e);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    
    try {
        const productIndex = database.products.findIndex(p => p.id == id);
        if (productIndex === -1) return res.status(404).json({ error: 'Not found' });
        
        database.products.splice(productIndex, 1);
        await saveDatabase();
        res.json({ ok: true, deleted: 1 });
    } catch (e) {
        console.error('Delete product error', e);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize database and start server
async function startServer() {
    await loadDatabase();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Admin login: http://localhost:${PORT}/admin-login.html`);
        console.log(`Username: admin, Password: admin123`);
    });
}

startServer();
