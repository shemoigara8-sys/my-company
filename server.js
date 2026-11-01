const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'blackwolf.db');

fs.mkdirSync(dataDir, { recursive: true });

const db = new sqlite3.Database(dbPath);
const adminEmail = process.env.ADMIN_EMAIL || 'admin@blackwolftechnologies.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'Blackwolf123!';

const DEFAULT_PRODUCTS = [
  {
    name: 'BlackWolf AI',
    slug: 'blackwolf-ai',
    category: 'AI',
    description: 'AI assistants for support, operations, administration, and business knowledge access.',
    price: 4900,
    status: 'active'
  },
  {
    name: 'BlackWolf Docs',
    slug: 'blackwolf-docs',
    category: 'Documents',
    description: 'Document digitization, PDF generation, extraction, and automated report creation.',
    price: 6200,
    status: 'active'
  },
  {
    name: 'BlackWolf Flow',
    slug: 'blackwolf-flow',
    category: 'Automation',
    description: 'Forms, approvals, workflow orchestration, and operational process automation.',
    price: 7600,
    status: 'active'
  },
  {
    name: 'BlackWolf Studio',
    slug: 'blackwolf-studio',
    category: 'Web Platforms',
    description: 'High-converting websites, SaaS landing pages, and digital experiences built for growth.',
    price: 5400,
    status: 'active'
  },
  {
    name: 'BlackWolf Geo',
    slug: 'blackwolf-geo',
    category: 'Geospatial',
    description: 'Geospatial intelligence, satellite-driven insights, and location-aware decision support.',
    price: 8900,
    status: 'active'
  }
];

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function initDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      category TEXT,
      description TEXT,
      price REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      project_type TEXT,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const existingAdmin = await get('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await run(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Administrator', adminEmail, passwordHash, 'admin']
    );
  }

  const productCount = await get('SELECT COUNT(*) as total FROM products');
  if (productCount && Number(productCount.total) === 0) {
    for (const product of DEFAULT_PRODUCTS) {
      await run(
        `INSERT INTO products (name, slug, category, description, price, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [product.name, product.slug, product.category, product.description, product.price, product.status]
      );
    }
  }
}

function requireApiAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  return next();
}

function requirePageAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  return next();
}

async function sendContactEmail(contact) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.log('SMTP not configured. Contact saved to DB only.');
    return { sent: false, reason: 'SMTP not configured' };
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@blackwolftechnologies.com',
    to: process.env.ADMIN_EMAIL || 'admin@blackwolftechnologies.com',
    subject: `New inquiry from ${contact.name}`,
    text: `Name: ${contact.name}\nEmail: ${contact.email}\nCompany: ${contact.company || 'N/A'}\nProject Type: ${contact.project_type || 'N/A'}\n\nMessage:\n${contact.message}`
  });

  return { sent: true };
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'blackwolf-technology-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 8,
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin', requirePageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'BlackWolf Technologies',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await all(
      `SELECT * FROM products WHERE status = 'active' ORDER BY created_at DESC`
    );
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch products.' });
  }
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  return res.json({ success: true, user: req.session.user });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const user = await get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    return res.json({
      success: true,
      message: 'Login successful.',
      user: req.session.user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Authentication failed.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: 'Logged out.' });
  });
});

app.post('/api/contact', async (req, res) => {
  const { name, email, company, projectType, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and message are required.'
    });
  }

  try {
    await run(
      `INSERT INTO contacts (name, email, company, project_type, message)
       VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), email.trim(), company || null, projectType || null, message.trim()]
    );

    const emailResult = await sendContactEmail({
      name: name.trim(),
      email: email.trim(),
      company: company || null,
      project_type: projectType || null,
      message: message.trim()
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you. Your inquiry has been received. We will contact you soon.',
      emailSent: emailResult.sent
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to submit your message. Please try again later.'
    });
  }
});

app.get('/api/admin/summary', requireApiAuth, async (req, res) => {
  try {
    const totalProducts = await get('SELECT COUNT(*) AS total FROM products');
    const totalLeads = await get('SELECT COUNT(*) AS total FROM contacts');
    const recentLead = await get('SELECT COUNT(*) AS total FROM contacts WHERE created_at >= datetime("now", "-7 days")');

    res.json({
      success: true,
      summary: {
        totalProducts: Number(totalProducts.total),
        totalLeads: Number(totalLeads.total),
        recentLeads: Number(recentLead.total)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load dashboard summary.' });
  }
});

app.get('/api/admin/products', requireApiAuth, async (req, res) => {
  try {
    const products = await all('SELECT * FROM products ORDER BY created_at DESC');
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch products.' });
  }
});

app.get('/api/admin/contacts', requireApiAuth, async (req, res) => {
  try {
    const contacts = await all('SELECT * FROM contacts ORDER BY created_at DESC LIMIT 50');
    res.json({ success: true, contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch contacts.' });
  }
});

app.post('/api/admin/products', requireApiAuth, async (req, res) => {
  const { name, category, description, price, status } = req.body || {};

  if (!name || !description) {
    return res.status(400).json({ success: false, message: 'Name and description are required.' });
  }

  try {
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'product';
    const numericPrice = Number(price) || 0;

    await run(
      `INSERT INTO products (name, slug, category, description, price, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name.trim(), slug, category || 'General', description.trim(), numericPrice, status || 'active']
    );

    res.status(201).json({ success: true, message: 'Product created successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to create product.' });
  }
});

app.delete('/api/admin/products/:id', requireApiAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true, message: 'Product deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to delete product.' });
  }
});

app.get('*', (req, res) => {
  const safeRoutes = ['/', '/login', '/admin'];
  if (safeRoutes.includes(req.path)) {
    const fileName = req.path === '/login' ? 'login.html' : req.path === '/admin' ? 'admin.html' : 'index.html';
    return res.sendFile(path.join(__dirname, 'public', fileName));
  }

  return res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function startServer() {
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`BlackWolf Technologies SaaS app is running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
