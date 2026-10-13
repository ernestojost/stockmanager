-- ============================================================================
-- StockManager — sample data (a small hardware & general store)
-- Admin user:  admin@stockmanager.com  / admin123
-- Seller user: seller@stockmanager.com / seller123
-- ============================================================================

USE stockmanager;
SET NAMES utf8mb4;

INSERT INTO users (email, password_hash, name, role) VALUES
  ('admin@stockmanager.com', '$2a$10$BtM20fNxKz3yZGPsXpO6M.i.9vp5GPIH7cLhdmu3fQzAOqfvYSP3q', 'Admin', 'admin'),
  ('seller@stockmanager.com', '$2a$10$c7Q7v0vsd/og39gKezr4K.zIEf1aP/vRFF1T8jYxoN27a44Tc96V2', 'Demo Seller', 'seller')
ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role);

INSERT INTO categories (name) VALUES
  ('Hand Tools'), ('Fasteners'), ('Paint & Supplies'), ('Cleaning')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO products (name, description, category_id, price, current_stock, min_stock, active) VALUES
  ('Claw Hammer 16 oz',            'Fiberglass handle, rubber grip', 1, 18.99,  8,  3, TRUE),
  ('Phillips Screwdriver #2',      '6-inch shaft, magnetic tip',     1,  6.49,  2,  5, TRUE),
  ('Wood Screws #8 x 1-1/4"',      'Box of 100, zinc-plated',        2,  7.99, 40, 12, TRUE),
  ('Drywall Anchors',              'Pack of 50, with screws',        2,  5.49,  5, 10, TRUE),
  ('Interior Latex Paint, 1 gal',  'Eggshell finish, white',         3, 32.99, 20,  5, TRUE),
  ('9" Paint Roller Kit',          'Roller frame, cover and tray',   3, 12.99,  3,  6, TRUE),
  ('All-Purpose Cleaner 32 oz',    'Spray bottle',                   4,  4.49, 50, 10, TRUE),
  ('Heavy-Duty Trash Bags',        '33 gal, box of 30',              4, 11.99, 30,  8, TRUE);

INSERT INTO customers (name, phone, email) VALUES
  ('John Miller', '(555) 201-4417', 'john.miller@example.com'),
  ('Sarah Thompson', '(555) 348-9021', 'sarah.thompson@example.com'),
  ('Oak Street Contractors', '(555) 610-7735', NULL);

-- Order history for the dashboard: the last few weeks of sales with real
-- line items, so the sales chart and the top-products table both have data.
-- Two recent orders are still pending and one was cancelled.
INSERT INTO orders (id, customer_id, user_id, status, total, created_at) VALUES
  (1, 3, 1, 'pending', 17.48, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
  (2, 1, 1, 'delivered', 141.94, DATE_SUB(NOW(), INTERVAL 26 HOUR)),
  (3, 1, 1, 'pending', 36.43, DATE_SUB(NOW(), INTERVAL 25 HOUR)),
  (4, 1, 1, 'delivered', 39.44, DATE_SUB(NOW(), INTERVAL 54 HOUR)),
  (5, 3, 1, 'delivered', 32.99, DATE_SUB(NOW(), INTERVAL 76 HOUR)),
  (6, 3, 2, 'delivered', 68.43, DATE_SUB(NOW(), INTERVAL 102 HOUR)),
  (7, 3, 2, 'delivered', 20.97, DATE_SUB(NOW(), INTERVAL 129 HOUR)),
  (8, 3, 1, 'delivered', 13.47, DATE_SUB(NOW(), INTERVAL 146 HOUR)),
  (9, 3, 1, 'delivered', 52.41, DATE_SUB(NOW(), INTERVAL 201 HOUR)),
  (10, 3, 2, 'cancelled', 41.93, DATE_SUB(NOW(), INTERVAL 218 HOUR)),
  (11, 3, 1, 'delivered', 47.96, DATE_SUB(NOW(), INTERVAL 265 HOUR)),
  (12, 3, 2, 'delivered', 104.89, DATE_SUB(NOW(), INTERVAL 313 HOUR)),
  (13, 1, 2, 'delivered', 64.95, DATE_SUB(NOW(), INTERVAL 363 HOUR)),
  (14, 2, 2, 'delivered', 16.97, DATE_SUB(NOW(), INTERVAL 441 HOUR)),
  (15, 2, 2, 'delivered', 53.93, DATE_SUB(NOW(), INTERVAL 508 HOUR)),
  (16, 1, 1, 'delivered', 37.98, DATE_SUB(NOW(), INTERVAL 577 HOUR)),
  (17, 1, 2, 'delivered', 23.96, DATE_SUB(NOW(), INTERVAL 657 HOUR));

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
  (1, 8, 1, 11.99),
  (1, 4, 1, 5.49),
  (2, 1, 4, 18.99),
  (2, 5, 2, 32.99),
  (3, 2, 2, 6.49),
  (3, 4, 1, 5.49),
  (3, 7, 4, 4.49),
  (4, 2, 1, 6.49),
  (4, 3, 3, 7.99),
  (4, 7, 2, 4.49),
  (5, 5, 1, 32.99),
  (6, 4, 3, 5.49),
  (6, 6, 4, 12.99),
  (7, 2, 2, 6.49),
  (7, 3, 1, 7.99),
  (8, 7, 3, 4.49),
  (9, 2, 4, 6.49),
  (9, 4, 4, 5.49),
  (9, 7, 1, 4.49),
  (10, 3, 3, 7.99),
  (10, 7, 4, 4.49),
  (11, 8, 4, 11.99),
  (12, 8, 4, 11.99),
  (12, 6, 3, 12.99),
  (12, 7, 4, 4.49),
  (13, 3, 4, 7.99),
  (13, 5, 1, 32.99),
  (14, 3, 1, 7.99),
  (14, 7, 2, 4.49),
  (15, 8, 3, 11.99),
  (15, 7, 4, 4.49),
  (16, 1, 2, 18.99),
  (17, 2, 3, 6.49),
  (17, 7, 1, 4.49);
