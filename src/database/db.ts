import Database from 'better-sqlite3';
import path from 'path';
import { app } from '@tauri-apps/api';

// Types pour la base de données
interface DatabaseUser {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'manager' | 'employee';
  name: string;
  email?: string;
  phone?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface DatabaseProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  cost_price: number;
  quantity: number;
  category: string;
  size?: string;
  color?: string;
  image?: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseSale {
  id: string;
  total_amount: number;
  payment_method: 'cash' | 'card' | 'mobile';
  customer_name?: string;
  employee_id: string;
  created_at: string;
}

interface DatabaseSaleItem {
  id: number;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

interface DatabaseCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export class SalmichouDatabase {
  private db: Database.Database;
  private dbPath: string;

  constructor() {
    // En développement, utiliser le dossier courant
    // En production avec Tauri, utiliser app.appDir()
    this.dbPath = './salmichou-layette.db';
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initDatabase();
  }

  private initDatabase() {
    // Table des utilisateurs
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'employee')),
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des catégories
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des produits
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        cost_price INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        category TEXT NOT NULL,
        size TEXT,
        color TEXT,
        image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category) REFERENCES categories(name)
      )
    `);

    // Table des ventes
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        total_amount INTEGER NOT NULL,
        payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'card', 'mobile')),
        customer_name TEXT,
        employee_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES users(id)
      )
    `);

    // Table des items de vente
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price INTEGER NOT NULL,
        total INTEGER NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    this.insertInitialData();
  }

  private insertInitialData() {
    // Vérifier si des données existent déjà
    const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    
    if (userCount.count === 0) {
      console.log('Insertion des données initiales...');
      
      // Insérer les utilisateurs par défaut
      const insertUser = this.db.prepare(`
        INSERT INTO users (id, username, password, role, name, email, phone, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertUser.run(
        '1', 'admin', 'admin123', 'admin', 
        'Administrateur Principal', 'admin@salmichou.cm', null, 1
      );
      insertUser.run(
        '2', 'gestionnaire', 'gest123', 'manager',
        'Gestionnaire Boutique', 'gestion@salmichou.cm', '+237 6XX XX XX XX', 1
      );
      insertUser.run(
        '3', 'vendeur', 'vend123', 'employee',
        'Vendeur Principal', null, '+237 6XX XX XX XX', 1
      );

      // Insérer les catégories par défaut
      const insertCategory = this.db.prepare(`
        INSERT INTO categories (id, name, description)
        VALUES (?, ?, ?)
      `);

      insertCategory.run('1', 'vêtements', 'Vêtements pour bébé');
      insertCategory.run('2', 'couches', 'Couches et changes');
      insertCategory.run('3', 'puériculture', 'Articles de puériculture');

      // Insérer quelques produits d'exemple
      const insertProduct = this.db.prepare(`
        INSERT INTO products (id, name, description, price, cost_price, quantity, category, size, color)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertProduct.run(
        '1', 'Body bébé coton', 'Body 100% coton bio', 
        10000, 5500, 25, 'vêtements', '0-3 mois', 'Blanc'
      );
      insertProduct.run(
        '2', 'Pyjama grenouillère', 'Pyjama chaud velours', 
        19500, 9800, 15, 'vêtements', '3-6 mois', 'Bleu'
      );
      insertProduct.run(
        '3', 'Couches taille 2', 'Lot de 24 couches', 
        8500, 4500, 50, 'couches', '3-6 kg', 'Blanc'
      );
      insertProduct.run(
        '4', 'Biberon 250ml', 'Biberon anti-colique', 
        6500, 3200, 30, 'puériculture', null, 'Transparent'
      );
    }
  }

  // ===== MÉTHODES UTILISATEURS =====
  getUsers(): DatabaseUser[] {
    return this.db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as DatabaseUser[];
  }

  getUserById(id: string): DatabaseUser | undefined {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DatabaseUser;
  }

  getUserByUsername(username: string): DatabaseUser | undefined {
    return this.db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username) as DatabaseUser;
  }

  createUser(userData: Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>): DatabaseUser {
    const id = Date.now().toString();
    const stmt = this.db.prepare(`
      INSERT INTO users (id, username, password, role, name, email, phone, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id, 
      userData.username, 
      userData.password, 
      userData.role, 
      userData.name, 
      userData.email, 
      userData.phone, 
      userData.is_active
    );
    
    return this.getUserById(id)!;
  }

  updateUser(id: string, updates: Partial<Omit<DatabaseUser, 'id' | 'created_at'>>): DatabaseUser {
    const fields = Object.keys(updates).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updates as any)[field]);
    
    const stmt = this.db.prepare(`
      UPDATE users 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    stmt.run(...values, id);
    return this.getUserById(id)!;
  }

  deleteUser(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  toggleUserStatus(id: string): DatabaseUser {
    const stmt = this.db.prepare(`
      UPDATE users 
      SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    stmt.run(id);
    return this.getUserById(id)!;
  }

  // ===== MÉTHODES PRODUITS =====
  getProducts(): DatabaseProduct[] {
    return this.db.prepare('SELECT * FROM products ORDER BY created_at DESC').all() as DatabaseProduct[];
  }

  getProductById(id: string): DatabaseProduct | undefined {
    return this.db.prepare('SELECT * FROM products WHERE id = ?').get(id) as DatabaseProduct;
  }

  createProduct(productData: Omit<DatabaseProduct, 'id' | 'created_at' | 'updated_at'>): DatabaseProduct {
    const id = Date.now().toString();
    const stmt = this.db.prepare(`
      INSERT INTO products (id, name, description, price, cost_price, quantity, category, size, color, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      productData.name,
      productData.description,
      productData.price,
      productData.cost_price,
      productData.quantity,
      productData.category,
      productData.size,
      productData.color,
      productData.image
    );
    
    return this.getProductById(id)!;
  }

  updateProduct(id: string, updates: Partial<Omit<DatabaseProduct, 'id' | 'created_at'>>): DatabaseProduct {
    const fields = Object.keys(updates).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updates as any)[field]);
    
    const stmt = this.db.prepare(`
      UPDATE products 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    stmt.run(...values, id);
    return this.getProductById(id)!;
  }

  deleteProduct(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM products WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  updateProductQuantity(id: string, newQuantity: number): void {
    const stmt = this.db.prepare('UPDATE products SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(newQuantity, id);
  }

  // ===== MÉTHODES CATÉGORIES =====
  getCategories(): DatabaseCategory[] {
    return this.db.prepare('SELECT * FROM categories ORDER BY name').all() as DatabaseCategory[];
  }

  createCategory(categoryData: Omit<DatabaseCategory, 'id' | 'created_at'>): DatabaseCategory {
    const id = Date.now().toString();
    const stmt = this.db.prepare('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)');
    stmt.run(id, categoryData.name, categoryData.description);
    return this.db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as DatabaseCategory;
  }

  // ===== MÉTHODES VENTES =====
  getSales(): DatabaseSale[] {
    return this.db.prepare('SELECT * FROM sales ORDER BY created_at DESC').all() as DatabaseSale[];
  }

  getSaleItems(saleId: string): DatabaseSaleItem[] {
    return this.db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(saleId) as DatabaseSaleItem[];
  }

  createSale(saleData: Omit<DatabaseSale, 'id' | 'created_at'>, items: Omit<DatabaseSaleItem, 'id' | 'sale_id'>[]): DatabaseSale {
    const saleId = Date.now().toString();
    
    // Créer la vente
    const saleStmt = this.db.prepare(`
      INSERT INTO sales (id, total_amount, payment_method, customer_name, employee_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    saleStmt.run(
      saleId,
      saleData.total_amount,
      saleData.payment_method,
      saleData.customer_name,
      saleData.employee_id
    );

    // Créer les items de vente
    const itemStmt = this.db.prepare(`
      INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price, total)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      itemStmt.run(
        saleId,
        item.product_id,
        item.product_name,
        item.quantity,
        item.price,
        item.total
      );

      // Mettre à jour le stock du produit
      this.updateProductQuantity(item.product_id, -item.quantity);
    }

    return this.db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId) as DatabaseSale;
  }

  // ===== MÉTHODES STATISTIQUES =====
  getSalesStats() {
    const totalSales = this.db.prepare('SELECT COUNT(*) as count FROM sales').get() as { count: number };
    const totalRevenue = this.db.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM sales').get() as { total: number };
    const totalProducts = this.db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
    const lowStockProducts = this.db.prepare('SELECT COUNT(*) as count FROM products WHERE quantity < 10').get() as { count: number };

    return {
      totalSales: totalSales.count,
      totalRevenue: totalRevenue.total,
      totalProducts: totalProducts.count,
      lowStockProducts: lowStockProducts.count
    };
  }

  getSalesByCategory() {
    return this.db.prepare(`
      SELECT 
        p.category,
        COALESCE(SUM(si.total), 0) as amount
      FROM products p
      LEFT JOIN sale_items si ON p.id = si.product_id
      GROUP BY p.category
      ORDER BY amount DESC
    `).all() as { category: string; amount: number }[];
  }

  close() {
    this.db.close();
  }
}

// Instance singleton globale
export const db = new SalmichouDatabase();