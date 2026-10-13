-- ============================================================================
-- StockManager — MySQL schema
--
-- Entity-relationship diagram (summary):
--
--   users (1) ──< orders (N)               a user (staff/admin) records orders
--   customers (1) ──< orders (N)           a customer can have many orders
--   categories (1) ──< products (N)        a product belongs to one category
--   orders (1) ──< order_items (N)         an order has many line items
--   products (1) ──< order_items (N)       a product can appear on many line items
--   products (1) ──< stock_movements (N)   every stock change is audited
--   orders (1) ──< stock_movements (N)     sale/cancellation movements reference their order
--
-- order_items is the junction table that resolves the N:M relationship between
-- orders and products, and it also freezes unit_price/quantity at the time of
-- sale (if the product's price changes later, past orders are not affected).
-- ============================================================================

CREATE DATABASE IF NOT EXISTS stockmanager
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE stockmanager;

SET NAMES utf8mb4;

-- ----------------------------------------------------------------------------
-- users: back-office login (store admins and sellers)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(150) NOT NULL,
  role          ENUM('admin','seller') NOT NULL DEFAULT 'seller',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- categories: group products (e.g. "Hand Tools", "Fasteners")
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- products: catalog with stock levels. Deleting is a soft delete
-- (active = false) so the order_items history that references them stays intact.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  description   VARCHAR(500) NULL,
  category_id   INT NULL,
  price         DECIMAL(10,2) NOT NULL,
  current_stock INT NOT NULL DEFAULT 0,
  min_stock     INT NOT NULL DEFAULT 0,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id)
    REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT chk_products_price CHECK (price >= 0),
  CONSTRAINT chk_products_current_stock CHECK (current_stock >= 0),
  CONSTRAINT chk_products_min_stock CHECK (min_stock >= 0)
) ENGINE=InnoDB;

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(active);

-- ----------------------------------------------------------------------------
-- customers: basic create and list
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  phone      VARCHAR(50) NULL,
  email      VARCHAR(150) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- orders: order header. total is computed server-side from order_items when
-- the order is created (sum of quantity * unit_price).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  user_id     INT NOT NULL,
  status      ENUM('pending','delivered','cancelled') NOT NULL DEFAULT 'pending',
  total       DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- ----------------------------------------------------------------------------
-- order_items: order line items. unit_price is "frozen" at the time of sale
-- (it does not reference the product's current price).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  product_id INT NOT NULL,
  quantity   INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
    REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id)
    REFERENCES products(id),
  CONSTRAINT chk_order_items_quantity CHECK (quantity > 0)
) ENGINE=InnoDB;

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ----------------------------------------------------------------------------
-- stock_movements: audit log of every change to products.current_stock.
-- quantity is signed (+ stock in, - stock out); resulting_stock is the
-- product's current_stock after applying this movement, so the history can be
-- read without recomputing running totals.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_movements (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  product_id      INT NOT NULL,
  type            ENUM('initial_stock','manual_adjustment','sale','cancellation') NOT NULL,
  quantity        INT NOT NULL,
  resulting_stock INT NOT NULL,
  order_id        INT NULL,
  user_id         INT NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_movements_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_movements_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_movements_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE INDEX idx_movements_product ON stock_movements(product_id);
CREATE INDEX idx_movements_order ON stock_movements(order_id);
