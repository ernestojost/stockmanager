-- ============================================================================
-- StockManager — schema de MySQL
--
-- Diagrama entidad-relación (resumen):
--
--   usuarios (1) ──< pedidos (N)          un usuario (empleado/admin) registra pedidos
--   clientes (1) ──< pedidos (N)          un cliente puede tener muchos pedidos
--   categorias (1) ──< productos (N)      un producto pertenece a una categoría
--   pedidos (1) ──< pedido_items (N)      un pedido tiene muchas líneas
--   productos (1) ──< pedido_items (N)    un producto puede aparecer en muchas líneas
--   productos (1) ──< movimientos_stock (N)  cada cambio de stock queda auditado
--   pedidos (1) ──< movimientos_stock (N)    movimientos de tipo venta/cancelacion referencian su pedido
--
-- pedido_items es la tabla intermedia que resuelve el N:M entre pedidos y
-- productos, y además congela precio_unitario/cantidad al momento de la venta
-- (si el precio del producto cambia después, no afecta pedidos ya hechos).
-- ============================================================================

CREATE DATABASE IF NOT EXISTS stockmanager
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE stockmanager;

SET NAMES utf8mb4;

-- ----------------------------------------------------------------------------
-- usuarios: login del panel interno (admin/empleados del negocio)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nombre        VARCHAR(150) NOT NULL,
  rol           ENUM('admin','vendedor') NOT NULL DEFAULT 'vendedor',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- categorias: agrupan productos (ej. "Bebidas", "Herramientas")
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- productos: catálogo con stock. Baja es soft-delete (activo=false) para no
-- romper el historial de pedido_items que ya los referencian.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(150) NOT NULL,
  descripcion   VARCHAR(500) NULL,
  categoria_id  INT NULL,
  precio        DECIMAL(10,2) NOT NULL,
  stock_actual  INT NOT NULL DEFAULT 0,
  stock_minimo  INT NOT NULL DEFAULT 0,
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id)
    REFERENCES categorias(id) ON DELETE SET NULL,
  CONSTRAINT chk_productos_precio CHECK (precio >= 0),
  CONSTRAINT chk_productos_stock_actual CHECK (stock_actual >= 0),
  CONSTRAINT chk_productos_stock_minimo CHECK (stock_minimo >= 0)
) ENGINE=InnoDB;

CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_activo ON productos(activo);

-- ----------------------------------------------------------------------------
-- clientes: alta y listado básico
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(150) NOT NULL,
  telefono   VARCHAR(50) NULL,
  email      VARCHAR(150) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- pedidos: cabecera. total se calcula server-side a partir de pedido_items al
-- crear el pedido (suma de cantidad * precio_unitario).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  usuario_id INT NOT NULL,
  estado     ENUM('pendiente','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  total      DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pedidos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_created_at ON pedidos(created_at);

-- ----------------------------------------------------------------------------
-- pedido_items: líneas del pedido. precio_unitario queda "congelado" al
-- momento de la venta (no referencia el precio actual del producto).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedido_items (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id       INT NOT NULL,
  producto_id     INT NOT NULL,
  cantidad        INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_pedido_items_pedido FOREIGN KEY (pedido_id)
    REFERENCES pedidos(id) ON DELETE CASCADE,
  CONSTRAINT fk_pedido_items_producto FOREIGN KEY (producto_id)
    REFERENCES productos(id),
  CONSTRAINT chk_pedido_items_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB;

CREATE INDEX idx_pedido_items_pedido ON pedido_items(pedido_id);
CREATE INDEX idx_pedido_items_producto ON pedido_items(producto_id);

-- ----------------------------------------------------------------------------
-- movimientos_stock: auditoría de todo cambio en productos.stock_actual.
-- cantidad es signada (+ entra stock, - sale stock); stock_resultante es el
-- stock_actual del producto luego de aplicar este movimiento, así el
-- historial se puede leer sin tener que ir recalculando.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimientos_stock (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  producto_id      INT NOT NULL,
  tipo             ENUM('alta_inicial','ajuste_manual','venta','cancelacion') NOT NULL,
  cantidad         INT NOT NULL,
  stock_resultante INT NOT NULL,
  pedido_id        INT NULL,
  usuario_id       INT NOT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_movimientos_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
  CONSTRAINT fk_movimientos_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  CONSTRAINT fk_movimientos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE INDEX idx_movimientos_producto ON movimientos_stock(producto_id);
CREATE INDEX idx_movimientos_pedido ON movimientos_stock(pedido_id);
