import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import 'dotenv/config';
import pool from './db.js';
import { initializeDatabase } from './init.js';
import { logger } from './logger.js';

const app = express();
// Keep the API port separate from Vite's PORT. Both servers run during
// development, so sharing the same environment variable causes a port clash.
const port = Number(process.env.API_PORT || process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET;
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:8443,http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!jwtSecret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET wajib diatur pada environment produksi.');
}

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => logger.info('http_request', {
    method: req.method,
    path: req.originalUrl,
    status: res.statusCode,
    durationMs: Date.now() - startedAt,
  }));
  next();
});

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin tidak diizinkan oleh CORS.'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

function buildAuthError() {
  return { message: 'Token tidak valid atau belum login.' };
}

function createToken(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role || 'admin' }, jwtSecret || 'development-only-secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

function localDateString(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value ?? date.getFullYear();
  const month = parts.find((part) => part.type === 'month')?.value ?? String(date.getMonth() + 1).padStart(2, '0');
  const day = parts.find((part) => part.type === 'day')?.value ?? String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function normalizeDateValue(value) {
  if (!value) return value;

  if (typeof value === 'string') {
    if (value.includes('T')) {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? value.split('T')[0] : localDateString(d);
    }
    return value;
  }

  if (value instanceof Date) {
    return localDateString(value);
  }

  return value;
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json(buildAuthError());
  }

  try {
    const decoded = jwt.verify(token, jwtSecret || 'development-only-secret');
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json(buildAuthError());
  }
}

const MANAGEMENT_ROLES = ['admin', 'cashier', 'owner'];
const OWNER_ROLES = ['admin', 'owner'];
const TRANSACTION_ROLES = ['admin', 'cashier', 'owner'];

function requireRole(req, res, next, allowedRoles = MANAGEMENT_ROLES) {
  const role = req.user?.role || 'admin';
  if (allowedRoles.includes(role)) {
    return next();
  }

  return res.status(403).json({ message: 'Akses Anda tidak diizinkan untuk fitur ini.' });
}

function requireManagementAccess(req, res, next) {
  return requireRole(req, res, next, MANAGEMENT_ROLES);
}

function requireOwnerAccess(req, res, next) {
  return requireRole(req, res, next, OWNER_ROLES);
}

function requireTransactionAccess(req, res, next) {
  return requireRole(req, res, next, TRANSACTION_ROLES);
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, message: 'Seruni API ready' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Database unavailable', error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi.' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    const token = createToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role || 'admin',
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login gagal.', error: error.message });
  }
});

app.post('/api/password-reset/request', async (req, res) => {
  const { email } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    return res.status(400).json({ message: 'Email wajib diisi.' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    const user = rows[0];

    if (!user) {
      return res.json({
        message: 'Jika email terdaftar, instruksi reset password akan kami kirimkan.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

    await pool.query(
      'UPDATE users SET reset_token = ?, reset_token_expires_at = ? WHERE id = ?',
      [resetToken, expiresAt, user.id],
    );

    return res.json({
      message: 'Instruksi reset password telah dibuat. Silakan cek email atau lanjutkan ke halaman ganti password.',
      token: resetToken,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memproses reset password.', error: error.message });
  }
});

app.post('/api/password-reset/confirm', async (req, res) => {
  const { token, newPassword } = req.body || {};

  if (!token || !newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ message: 'Token dan password baru minimal 6 karakter wajib diisi.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires_at > NOW() LIMIT 1',
      [token],
    );

    const user = rows[0];
    if (!user) {
      return res.status(400).json({ message: 'Token reset tidak valid atau sudah kedaluwarsa.' });
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    await pool.query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires_at = NULL, last_password_changed_at = NOW() WHERE id = ?',
      [passwordHash, user.id],
    );

    return res.json({ message: 'Password berhasil diperbarui.' });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengganti password.', error: error.message });
  }
});

app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, full_name, email, role, last_password_changed_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id],
    );

    const user = rows[0];
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    return res.json({
      id: user.id,
      username: user.username,
      fullName: user.full_name || '',
      email: user.email || '',
      role: user.role || 'admin',
      lastPasswordChangedAt: user.last_password_changed_at ? new Date(user.last_password_changed_at).toISOString() : null,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memuat profil user.', error: error.message });
  }
});

app.put('/api/profile', authMiddleware, async (req, res) => {
  const { email, fullName } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedFullName = String(fullName || '').trim();

  if (!normalizedEmail) {
    return res.status(400).json({ message: 'Email wajib diisi sebelum menyimpan profil.' });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Format email tidak valid. Contoh: nama@email.com' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1', [normalizedEmail, req.user.id]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email sudah digunakan akun lain.' });
    }

    await pool.query('UPDATE users SET email = ?, full_name = ? WHERE id = ?', [normalizedEmail, normalizedFullName || null, req.user.id]);

    return res.json({
      message: 'Profil berhasil disimpan.',
      email: normalizedEmail,
      fullName: normalizedFullName || '',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal menyimpan profil.', error: error.message });
  }
});

app.put('/api/profile/password', authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Password lama dan password baru wajib diisi.' });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: 'Password baru minimal 6 karakter.' });
  }

  if (!/[A-Za-z]/.test(String(newPassword)) || !/[0-9]/.test(String(newPassword))) {
    return res.status(400).json({ message: 'Password baru harus mengandung huruf dan angka.' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [req.user.id]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    const valid = await bcrypt.compare(String(oldPassword), user.password_hash);
    if (!valid) {
      return res.status(400).json({ message: 'Password lama tidak sesuai.' });
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    await pool.query('UPDATE users SET password_hash = ?, last_password_changed_at = NOW() WHERE id = ?', [passwordHash, user.id]);

    return res.json({ message: 'Password berhasil diubah.' });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengganti password.', error: error.message });
  }
});

app.get('/api/menu', authMiddleware, async (_req, res) => {
  const role = _req.user?.role || 'admin';
  if (!MANAGEMENT_ROLES.includes(role)) {
    return res.status(403).json({ message: 'Anda sebagai viewer. Hanya bisa melihat data.' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM menu ORDER BY category, name ASC');
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengambil data menu.', error: error.message });
  }
});

app.post('/api/menu', authMiddleware, requireOwnerAccess, async (req, res) => {
  const { name, category, price, emoji, stock } = req.body || {};
  if (!name || !category || price == null || stock == null) {
    return res.status(400).json({ message: 'Nama, kategori, harga, dan stok wajib diisi.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO menu (name, category, price, emoji, stock) VALUES (?, ?, ?, ?, ?)',
      [name, category, Number(price), emoji || '🍹', Number(stock)],
    );

    const [rows] = await pool.query('SELECT * FROM menu WHERE id = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Gagal menambah menu.', error: error.message });
  }
});

app.put('/api/menu/:id', authMiddleware, requireOwnerAccess, async (req, res) => {
  const { id } = req.params;
  const { name, category, price, emoji, stock } = req.body || {};

  try {
    await pool.query(
      'UPDATE menu SET name = ?, category = ?, price = ?, emoji = ?, stock = ? WHERE id = ?',
      [name, category, Number(price), emoji, Number(stock), id],
    );

    const [rows] = await pool.query('SELECT * FROM menu WHERE id = ?', [id]);
    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengubah menu.', error: error.message });
  }
});

app.delete('/api/menu/:id', authMiddleware, requireOwnerAccess, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM menu WHERE id = ?', [id]);
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ message: 'Gagal hapus menu.', error: error.message });
  }
});

app.get('/api/expenses', authMiddleware, async (_req, res) => {
  const role = _req.user?.role || 'admin';
  if (!OWNER_ROLES.includes(role)) {
    return res.status(403).json({ message: 'Akses Anda tidak diizinkan untuk fitur ini.' });
  }

  try {
    const [rows] = await pool.query('SELECT id, description, amount, category, expense_date AS date, created_at AS timestamp FROM expenses ORDER BY expense_date DESC, amount DESC');
    res.json(rows.map((row) => ({
      ...row,
      date: normalizeDateValue(row.date),
      timestamp: row.timestamp ? new Date(row.timestamp).getTime() : Date.now(),
    })));
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil pengeluaran.', error: error.message });
  }
});

app.post('/api/expenses', authMiddleware, requireOwnerAccess, async (req, res) => {
  const { description, amount, category, date } = req.body || {};
  if (!description || amount == null || !category || !date) {
    return res.status(400).json({ message: 'Keterangan, nominal, kategori, dan tanggal wajib diisi.' });
  }

  try {
    const safeDate = normalizeDateValue(date);
    const [result] = await pool.query('INSERT INTO expenses (description, amount, category, expense_date) VALUES (?, ?, ?, ?)', [
      description,
      Number(amount),
      category,
      safeDate,
    ]);

    const [rows] = await pool.query('SELECT id, description, amount, category, expense_date AS date, created_at AS timestamp FROM expenses WHERE id = ?', [result.insertId]);
    return res.status(201).json({
      ...rows[0],
      date: normalizeDateValue(rows[0].date),
      timestamp: rows[0].timestamp ? new Date(rows[0].timestamp).getTime() : Date.now(),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal menyimpan pengeluaran.', error: error.message });
  }
});

app.put('/api/expenses/:id', authMiddleware, requireOwnerAccess, async (req, res) => {
  const { id } = req.params;
  const { description, amount, category, date } = req.body || {};

  try {
    const safeDate = normalizeDateValue(date);
    await pool.query(
      'UPDATE expenses SET description = ?, amount = ?, category = ?, expense_date = ? WHERE id = ?',
      [description, Number(amount), category, safeDate, id],
    );

    const [rows] = await pool.query('SELECT id, description, amount, category, expense_date AS date, created_at AS timestamp FROM expenses WHERE id = ?', [id]);
    return res.json({
      ...rows[0],
      date: normalizeDateValue(rows[0].date),
      timestamp: rows[0].timestamp ? new Date(rows[0].timestamp).getTime() : Date.now(),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengubah pengeluaran.', error: error.message });
  }
});

app.delete('/api/expenses/:id', authMiddleware, requireOwnerAccess, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM expenses WHERE id = ?', [id]);
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ message: 'Gagal hapus pengeluaran.', error: error.message });
  }
});

app.get('/api/sales', authMiddleware, async (_req, res) => {
  const role = _req.user?.role || 'admin';
  if (!['admin', 'cashier', 'owner'].includes(role)) {
    return res.status(403).json({ message: 'Anda sebagai viewer. Hanya bisa melihat data.' });
  }

  try {
    const [salesRows] = await pool.query('SELECT id, total, sale_date AS date, created_at AS timestamp FROM sales ORDER BY created_at DESC');
    const result = [];

    for (const sale of salesRows) {
      const [items] = await pool.query('SELECT menu_id AS menuItemId, menu_name AS name, qty, unit_price AS price FROM sale_items WHERE sale_id = ?', [sale.id]);
      result.push({
        ...sale,
        date: normalizeDateValue(sale.date),
        timestamp: new Date(sale.timestamp).getTime(),
        items: items.map((item) => ({
          ...item,
          menuItemId: Number(item.menuItemId),
          qty: Number(item.qty),
          price: Number(item.price),
        })),
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data penjualan.', error: error.message });
  }
});

app.post('/api/sales', authMiddleware, requireTransactionAccess, async (req, res) => {
  const { items = [], date } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Item penjualan wajib diisi.' });
  }

  const normalizedItems = items.map((item) => ({
    menuId: Number(item.menuItemId || item.menu_id || item.menu_item_id),
    qty: Number(item.qty),
  }));

  if (normalizedItems.some((item) => !Number.isInteger(item.menuId) || item.menuId <= 0 || !Number.isInteger(item.qty) || item.qty <= 0)) {
    return res.status(400).json({ message: 'Kuantitas setiap item harus berupa bilangan bulat lebih dari 0.' });
  }

  const saleDate = normalizeDateValue(date || localDateString(new Date()));

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const menuIds = [...new Set(normalizedItems.map((item) => item.menuId))];
    const placeholders = menuIds.map(() => '?').join(',');

    const [menuRows] = await connection.query(
      `SELECT id, name, price, stock FROM menu WHERE id IN (${placeholders}) FOR UPDATE`,
      menuIds,
    );

    const menuMap = new Map(menuRows.map((row) => [Number(row.id), {
      id: Number(row.id),
      name: row.name,
      price: Number(row.price),
      stock: Number(row.stock),
    }]));
    const requestedQty = new Map();

    for (const item of normalizedItems) {
      const menu = menuMap.get(item.menuId);

      if (!menu) {
        throw new Error(`Menu ${item.menuId} tidak ditemukan.`);
      }

      requestedQty.set(item.menuId, (requestedQty.get(item.menuId) || 0) + item.qty);
    }

    for (const [menuId, qty] of requestedQty.entries()) {
      const menu = menuMap.get(menuId);
      if (!menu || qty > menu.stock) {
        throw new Error(`Stok ${menu?.name || menuId} tidak cukup.`);
      }
    }

    for (const [menuId, qty] of requestedQty.entries()) {
      const menu = menuMap.get(menuId);
      const nextStock = menu.stock - qty;
      await connection.query('UPDATE menu SET stock = ? WHERE id = ?', [nextStock, menuId]);
    }

    const safeItems = normalizedItems.map((item) => {
      const menu = menuMap.get(item.menuId);
      return { menuId: item.menuId, qty: item.qty, name: menu.name, price: menu.price };
    });
    const calculatedTotal = safeItems.reduce((sum, item) => sum + item.qty * item.price, 0);

    const [saleResult] = await connection.query('INSERT INTO sales (total, sale_date) VALUES (?, ?)', [
      calculatedTotal,
      saleDate,
    ]);

    const saleId = saleResult.insertId;

    for (const item of safeItems) {
      await connection.query(
        'INSERT INTO sale_items (sale_id, menu_id, menu_name, qty, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        [saleId, item.menuId, item.name, item.qty, item.price, item.qty * item.price],
      );
    }

    await connection.commit();

    const [saleRows] = await connection.query('SELECT * FROM sales WHERE id = ?', [saleId]);
    const [saleItems] = await connection.query('SELECT menu_id AS menuItemId, menu_name AS name, qty, unit_price AS price, subtotal FROM sale_items WHERE sale_id = ?', [saleId]);

    return res.status(201).json({
      ...saleRows[0],
      date: normalizeDateValue(saleRows[0].sale_date),
      timestamp: new Date(saleRows[0].created_at).getTime(),
      items: saleItems.map((item) => ({
        ...item,
        menuItemId: Number(item.menuItemId),
        qty: Number(item.qty),
        price: Number(item.price),
      })),
    });
  } catch (error) {
    await connection.rollback();
    return res.status(400).json({ message: error.message || 'Transaksi gagal.' });
  } finally {
    connection.release();
  }
});

app.delete('/api/sales/:id', authMiddleware, requireOwnerAccess, async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [saleRows] = await connection.query('SELECT * FROM sales WHERE id = ?', [id]);
    if (!saleRows.length) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }

    const [items] = await connection.query('SELECT menu_id AS menuItemId, qty FROM sale_items WHERE sale_id = ?', [id]);

    for (const item of items) {
      await connection.query(
        'UPDATE menu SET stock = stock + ? WHERE id = ?',
        [Number(item.qty || 0), item.menuItemId],
      );
    }

    await connection.query('DELETE FROM sale_items WHERE sale_id = ?', [id]);
    await connection.query('DELETE FROM sales WHERE id = ?', [id]);
    await connection.commit();

    return res.json({ success: true, id });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: 'Gagal membatalkan transaksi.', error: error.message });
  } finally {
    connection.release();
  }
});

app.get('/api/dashboard', authMiddleware, requireOwnerAccess, async (_req, res) => {
  try {
    const [salesRows] = await pool.query('SELECT id, total, sale_date AS date, created_at AS timestamp FROM sales ORDER BY created_at DESC');
    const [expenseRows] = await pool.query('SELECT id, description, amount, category, expense_date AS date, created_at AS timestamp FROM expenses ORDER BY expense_date DESC');

    const today = localDateString(new Date());
    const todaySales = salesRows.filter((sale) => normalizeDateValue(sale.date) === today);
    const todayRevenue = todaySales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const todayOrders = todaySales.length;
    const todayExpensesTotal = expenseRows.filter((expense) => expense.date === today).reduce((sum, expense) => sum + Number(expense.amount), 0);

    const last7Days = Array.from({ length: 7 }, (_, index) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - index));
      return localDateString(d);
    });

    const chartData = last7Days.map((date) => {
      const daySales = salesRows.filter((sale) => normalizeDateValue(sale.date) === date).reduce((sum, sale) => sum + Number(sale.total), 0);
      const dayExpenses = expenseRows.filter((expense) => normalizeDateValue(expense.date) === date).reduce((sum, expense) => sum + Number(expense.amount), 0);
      const label = new Date(date).toLocaleDateString('id-ID', { weekday: 'short' });
      return { label, pemasukan: daySales, pengeluaran: dayExpenses };
    });

    const productCounts = {};
    for (const sale of salesRows) {
      const [items] = await pool.query('SELECT menu_name AS name, qty FROM sale_items WHERE sale_id = ?', [sale.id]);
      for (const item of items) {
        productCounts[item.name] = (productCounts[item.name] || 0) + Number(item.qty);
      }
    }

    const [topName, topQty] = Object.entries(productCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0] || ['-', 0];

    const normalizedSales = salesRows.map((sale) => ({
      ...sale,
      date: normalizeDateValue(sale.date),
      timestamp: new Date(sale.timestamp).getTime(),
      items: [],
    }));

    for (const sale of normalizedSales) {
      const [items] = await pool.query('SELECT menu_id AS menuItemId, menu_name AS name, qty, unit_price AS price FROM sale_items WHERE sale_id = ?', [sale.id]);
      sale.items = items.map((item) => ({
        ...item,
        menuItemId: Number(item.menuItemId),
        qty: Number(item.qty),
        price: Number(item.price),
      }));
    }

    res.json({
      todayRevenue,
      todayOrders,
      todayExpensesTotal,
      todayProfit: todayRevenue - todayExpensesTotal,
      chartData,
      recentSales: normalizedSales.slice(0, 5),
      topProduct: { name: topName, qty: Number(topQty) },
      sales: normalizedSales,
      expenses: expenseRows.map((expense) => ({
        ...expense,
        date: normalizeDateValue(expense.date),
        timestamp: expense.timestamp ? new Date(expense.timestamp).getTime() : Date.now(),
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data dashboard.', error: error.message });
  }
});

async function startServer() {
  await initializeDatabase();
  app.listen(port, () => {
    logger.info('server_started', { port, environment: process.env.NODE_ENV || 'development', allowedOrigins });
  });
}

// In serverless environments like Vercel, the platform manages the HTTP server.
if (process.env.VERCEL !== '1') {
  startServer().catch((error) => {
    logger.error('server_start_failed', error);
    process.exit(1);
  });
}

app.use((error, req, res, _next) => {
  logger.error('unhandled_request_error', error, { method: req.method, path: req.originalUrl });
  const isCorsError = error.message === 'Origin tidak diizinkan oleh CORS.';
  res.status(isCorsError ? 403 : 500).json({
    message: isCorsError ? error.message : 'Terjadi kesalahan pada server.',
  });
});

export default app;
