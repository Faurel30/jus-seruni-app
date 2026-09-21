import bcrypt from 'bcryptjs';
import pool from './db.js';

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin','owner','cashier','viewer') NOT NULL DEFAULT 'admin',
    full_name VARCHAR(100) DEFAULT 'Admin',
    is_email_verified TINYINT(1) NOT NULL DEFAULT 0,
    reset_token VARCHAR(255) NULL,
    reset_token_expires_at DATETIME NULL,
    last_password_changed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS menu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price INT NOT NULL,
    emoji VARCHAR(20) DEFAULT '',
    stock INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total INT NOT NULL,
    sale_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    menu_id INT NOT NULL,
    menu_name VARCHAR(255) NOT NULL,
    qty INT NOT NULL,
    unit_price INT NOT NULL,
    subtotal INT NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    expense_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
  )`,
];

// Run an ALTER TABLE migration safely. If it fails (e.g. minor syntax
// differences on TiDB Cloud), log a warning and continue instead of crashing.
async function safeMigrate(connection, label, query) {
  try {
    await connection.query(query);
  } catch (error) {
    console.warn(`[init] Migration "${label}" skipped: ${error.message}`);
  }
}

export async function initializeDatabase() {
  const connection = await pool.getConnection();
  try {
    for (const statement of schemaStatements) {
      await connection.query(statement);
    }

    const [roleColumns] = await connection.query("SHOW COLUMNS FROM users LIKE 'role'");
    if (!roleColumns.length) {
      await safeMigrate(connection, 'add role column', "ALTER TABLE users ADD COLUMN role ENUM('admin','owner','cashier','viewer') NOT NULL DEFAULT 'admin'");
    } else {
      await safeMigrate(connection, 'modify role column', "ALTER TABLE users MODIFY COLUMN role ENUM('admin','owner','cashier','viewer') NOT NULL DEFAULT 'admin'");
    }

    await safeMigrate(connection, 'modify menu category', "ALTER TABLE menu MODIFY COLUMN category VARCHAR(100) NOT NULL");

    const [emailColumns] = await connection.query("SHOW COLUMNS FROM users LIKE 'email'");
    if (!emailColumns.length) {
      await safeMigrate(connection, 'add email column', "ALTER TABLE users ADD COLUMN email VARCHAR(150) NULL UNIQUE AFTER username");
    }

    const [verifiedColumns] = await connection.query("SHOW COLUMNS FROM users LIKE 'is_email_verified'");
    if (!verifiedColumns.length) {
      await safeMigrate(connection, 'add is_email_verified column', "ALTER TABLE users ADD COLUMN is_email_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER email");
    }

    const [resetTokenColumns] = await connection.query("SHOW COLUMNS FROM users LIKE 'reset_token'");
    if (!resetTokenColumns.length) {
      await safeMigrate(connection, 'add reset_token column', "ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL AFTER is_email_verified");
    }

    const [resetExpiryColumns] = await connection.query("SHOW COLUMNS FROM users LIKE 'reset_token_expires_at'");
    if (!resetExpiryColumns.length) {
      await safeMigrate(connection, 'add reset_token_expires_at column', "ALTER TABLE users ADD COLUMN reset_token_expires_at DATETIME NULL AFTER reset_token");
    }

    const [lastPasswordChangedColumns] = await connection.query("SHOW COLUMNS FROM users LIKE 'last_password_changed_at'");
    if (!lastPasswordChangedColumns.length) {
      await safeMigrate(connection, 'add last_password_changed_at column', "ALTER TABLE users ADD COLUMN last_password_changed_at DATETIME NULL AFTER reset_token_expires_at");
    }

    const [userFullName] = await connection.query("SHOW COLUMNS FROM users LIKE 'full_name'");
    if (!userFullName.length) {
      await safeMigrate(connection, 'add full_name column', "ALTER TABLE users ADD COLUMN full_name VARCHAR(100) DEFAULT 'Admin'");
    }

    const [userCreatedAt] = await connection.query("SHOW COLUMNS FROM users LIKE 'created_at'");
    if (!userCreatedAt.length) {
      await safeMigrate(connection, 'add created_at column', "ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    }

    const defaultUsers = [
      { username: process.env.DEFAULT_ADMIN_USERNAME || 'admin', password: process.env.DEFAULT_ADMIN_PASSWORD || '12345678', role: 'admin', fullName: 'Admin Seruni', email: 'admin@seruni.test' },
      { username: 'cashier', password: '12345678', role: 'cashier', fullName: 'Kasir Seruni', email: 'cashier@seruni.test' },
      { username: 'viewer', password: '12345678', role: 'viewer', fullName: 'Viewer Seruni', email: 'viewer@seruni.test' },
    ];

    for (const user of defaultUsers) {
      const [rows] = await connection.query('SELECT id FROM users WHERE username = ?', [user.username]);
      if (!rows.length) {
        const passwordHash = await bcrypt.hash(user.password, 10);
        await connection.query(
          'INSERT INTO users (username, email, password_hash, role, full_name, is_email_verified, last_password_changed_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
          [user.username, user.email, passwordHash, user.role, user.fullName, 1],
        );
      } else {
        await connection.query(
          'UPDATE users SET last_password_changed_at = COALESCE(last_password_changed_at, NOW()) WHERE username = ?',
          [user.username],
        );
      }
    }

    const [menuRows] = await connection.query('SELECT COUNT(*) as total FROM menu');
    if (menuRows[0].total === 0) {
      const defaultMenu = [
        ['Jus Alpukat', 'Jus Buah', 10000, '🥑', 25],
        ['Jus Mangga', 'Jus Buah', 8000, '🥭', 30],
        ['Jus Jeruk', 'Jus Buah', 8000, '🍊', 20],
        ['Jus Semangka', 'Jus Buah', 9000, '🍉', 18],
        ['Jus Jambu', 'Jus Buah', 8000, '🍓', 15],
        ['Pop Ice Coklat', 'Pop Ice', 6000, '🍫', 40],
        ['Pop Ice Taro', 'Pop Ice', 6000, '🫐', 35],
        ['Pop Ice Melon', 'Pop Ice', 6000, '🍈', 32],
        ['Burger Biasa', 'Burger', 15000, '🍔', 12],
        ['Burger Special', 'Burger', 20000, '🍔', 10],
      ];

      for (const item of defaultMenu) {
        await connection.query(
          'INSERT INTO menu (name, category, price, emoji, stock) VALUES (?, ?, ?, ?, ?)',
          item,
        );
      }
    }
  } finally {
    connection.release();
  }
}

if (process.argv[1] && process.argv[1].endsWith('init.js')) {
  initializeDatabase()
    .then(() => {
      console.log('Database schema and seed data are ready.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database seed failed:', error.message);
      process.exit(1);
    });
}
