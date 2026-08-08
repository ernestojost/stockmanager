-- ============================================================================
-- StockManager — datos de ejemplo
-- Usuario admin: admin@stockmanager.com / admin123
-- ============================================================================

USE stockmanager;
SET NAMES utf8mb4;

INSERT INTO usuarios (email, password_hash, nombre) VALUES
  ('admin@stockmanager.com', '$2a$10$BtM20fNxKz3yZGPsXpO6M.i.9vp5GPIH7cLhdmu3fQzAOqfvYSP3q', 'Admin')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

INSERT INTO categorias (nombre) VALUES
  ('Bebidas'), ('Almacén'), ('Limpieza'), ('Herramientas')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

INSERT INTO productos (nombre, descripcion, categoria_id, precio, stock_actual, stock_minimo, activo) VALUES
  ('Agua mineral 500ml', 'Botella descartable', 1, 800.00, 50, 10, TRUE),
  ('Gaseosa cola 1.5L',  'Botella descartable', 1, 1800.00, 30, 8, TRUE),
  ('Arroz 1kg',          'Arroz blanco largo fino', 2, 1500.00, 5, 10, TRUE),
  ('Fideos 500g',        'Fideos secos', 2, 900.00, 40, 12, TRUE),
  ('Detergente 750ml',   'Lavavajillas', 3, 2200.00, 3, 6, TRUE),
  ('Lavandina 1L',       'Uso doméstico', 3, 1100.00, 20, 5, TRUE),
  ('Martillo',           'Mango de madera', 4, 5400.00, 8, 3, TRUE),
  ('Destornillador phillips', 'Punta n°2', 4, 2100.00, 2, 5, TRUE);

INSERT INTO clientes (nombre, telefono, email) VALUES
  ('Juan Pérez', '11-5555-1234', 'juanperez@example.com'),
  ('María Gómez', '11-5555-5678', 'mariagomez@example.com'),
  ('Kiosco Don Ramón', '11-5555-9012', NULL);
