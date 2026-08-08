# Sistema de Inventario y Pedidos (React + Express + MySQL) — "StockManager"

## Resumen

Una SPA de gestión de inventario y pedidos para un negocio chico (podés orientarlo a una tienda de ropa, ferretería, o algo genérico). Frontend en **React puro** (sin Next.js — este proyecto es justamente para mostrar React sin el paraguas de un meta-framework), backend propio en **Express.js**, base de datos **MySQL**. Es el proyecto más "backend-heavy" de los tres: modelado de datos relacional real, API REST bien diseñada, lógica de negocio (stock, pedidos, totales).

## Por qué este proyecto

- Conecta directo con tu experiencia real haciendo tiendas online freelance, sin depender de nombrar ninguna plataforma específica — es tu propia versión, hecha por vos de punta a punta.
- Es el proyecto que más muestra diseño de base de datos y de API — lo que un reclutador técnico mira para evaluar seniority real.
- React sin Next.js muestra que entendés los fundamentos (routing con React Router, manejo de estado, fetch a una API propia) y no dependés únicamente de las abstracciones de un framework.

## Stack técnico

- **React** (Vite como bundler, no Create React App) + **React Router**
- **Express.js** (API REST)
- **MySQL** (con `mysql2` + queries directas, o Sequelize/Prisma si preferís un ORM — para este proyecto está bien mostrar SQL más "a mano" ya que el objetivo es demostrar modelado relacional)
- Estado del frontend: Context API o Zustand alcanza, no hace falta Redux para este alcance
- Auth simple con JWT (login de admin/empleado del negocio — no es multi-tenant, es un panel interno)

## Funcionalidad principal (MVP)

1. **Login** (usuario admin del negocio).
2. **Productos**: alta, edición, baja (soft delete), listado con stock actual, categoría, precio.
3. **Clientes**: alta y listado básico (nombre, contacto).
4. **Pedidos**: crear un pedido nuevo seleccionando cliente + productos + cantidades → calcula total automáticamente y **descuenta stock**.
5. **Listado de pedidos** con estado (pendiente, entregado, cancelado) y filtro por fecha/estado.
6. **Alerta de stock bajo**: productos por debajo de un umbral configurable se marcan visualmente en el listado.
7. **Dashboard simple**: total vendido del mes, productos más vendidos, pedidos pendientes.

## Modelo de datos (MySQL)

```sql
usuarios (id, email, password_hash, nombre, rol ENUM('admin','vendedor'), created_at)

categorias (id, nombre)

productos (
  id, nombre, descripcion, categoria_id FK,
  precio, stock_actual, stock_minimo,
  activo BOOLEAN, created_at
)

clientes (id, nombre, telefono, email, created_at)

pedidos (
  id, cliente_id FK, usuario_id FK,
  estado ENUM('pendiente','entregado','cancelado'),
  total, created_at
)

pedido_items (
  id, pedido_id FK -> pedidos.id, producto_id FK -> productos.id,
  cantidad, precio_unitario
)

movimientos_stock (
  id, producto_id FK -> productos.id,
  tipo ENUM('alta_inicial','ajuste_manual','venta','cancelacion'),
  cantidad, stock_resultante,
  pedido_id FK -> pedidos.id (nullable),
  usuario_id FK -> usuarios.id, created_at
)
```

Este es el proyecto donde más vale la pena mostrar el diagrama entidad-relación en el repo (un `schema.png` o `.sql` con comentarios) — es justo lo que un reclutador técnico quiere ver rápido sin leer todo el código.

## Endpoints principales (API REST)

```
POST   /api/auth/login

GET    /api/productos          GET /api/productos/:id
POST   /api/productos*         PUT /api/productos/:id*      DELETE /api/productos/:id*
GET    /api/productos/:id/movimientos*     (historial de stock)

GET    /api/clientes           POST /api/clientes

GET    /api/pedidos            GET /api/pedidos/:id
POST   /api/pedidos            PATCH /api/pedidos/:id/estado
GET    /api/pedidos/export*    (?formato=csv|pdf, mismos filtros que el listado)

GET    /api/dashboard/resumen*             GET /api/dashboard/ventas*  (?agrupacion=dia|semana|mes)

GET    /api/usuarios*          POST /api/usuarios*

  * = solo rol admin (403 para vendedor)
```

## Páginas / rutas (frontend)

- `/login`
- `/` — Dashboard (admin) o accesos rápidos (vendedor)
- `/productos` — Listado + alta/edición + historial de stock (admin); solo lectura para vendedor
- `/clientes` — Listado + alta
- `/pedidos` — Listado + filtros + export CSV/PDF (admin)
- `/pedidos/nuevo` — Formulario de nuevo pedido (selección de productos con búsqueda, cálculo de total en vivo)
- `/usuarios` — Alta de usuarios y asignación de rol (admin)

## Diseño y UX

- Es un panel interno, no algo "de venta" — priorizá densidad de información y velocidad sobre estética llamativa (tablas claras, atajos de teclado si te da el tiempo, formularios rápidos).
- El formulario de "nuevo pedido" es la pieza más compleja de UX: buscar producto → agregar a la lista → ajustar cantidad → ver total actualizarse. Vale la pena invertir tiempo ahí.
- Validaciones reales: no dejar vender más stock del disponible, no permitir precios negativos, etc. — mostrar que pensaste los casos borde es lo que separa un CRUD de tutorial de un sistema real.

## Funcionalidades extra (implementadas)

- [x] **Historial de movimientos de stock (auditoría)** — cada alta, ajuste manual, venta y cancelación queda registrada en `movimientos_stock` con el stock resultante, quién lo hizo y de qué pedido viene (si aplica). Botón "Historial" en Productos (admin).
- [x] **Múltiples usuarios con roles (admin/vendedor)** — un vendedor puede vender (crear/consultar pedidos, ver clientes y productos) pero no toca precios/stock, no ve el dashboard financiero, no exporta y no gestiona usuarios. Ver tabla de permisos en `backend/src/middleware/auth.js` (`requireRole`) y las rutas gateadas en `server.js`.
- [x] **Exportar pedidos a CSV/PDF** — respeta los filtros activos del listado (estado/fecha). CSV con BOM UTF-8 para que Excel abra bien los acentos; PDF generado con `pdfkit`.
- [x] **Gráfico de ventas por período** — barras (día/semana/mes) en el dashboard, hecho a mano en SVG inline (sin librería de charts).

## Qué mostrar en el portfolio

- **Código**: `EJ-0X`
- **Descripción corta**: "Sistema de inventario y pedidos con control de stock en tiempo real — React, Express y MySQL de punta a punta."
- **Stack tags**: `React`, `Express.js`, `MySQL`, `JWT`
- Este es el proyecto ideal para linkear el repo del backend por separado si lo separás en dos repos (frontend/backend) — muestra que sabés estructurar un proyecto full-stack real, no todo mezclado.

## Checklist para arrancar

- [x] Diseñar el schema de MySQL primero (antes que el código) — dibujalo o escribilo en SQL con comentarios
- [x] `npm create vite@latest` para el frontend, proyecto Express separado para el backend
- [x] Auth con JWT
- [x] CRUD de productos y clientes
- [x] Lógica de pedidos (con descuento de stock y validaciones)
- [x] Dashboard con las 2-3 métricas clave
- [ ] Deploy (frontend en Vercel/Netlify, backend + MySQL en Railway o Render)

## Cómo correr el proyecto

Estructura: `/backend` (API Express) y `/frontend` (SPA Vite+React) como dos
proyectos independientes dentro de este repo, más un `docker-compose.yml` en
la raíz que puede levantar solo MySQL o el stack completo.

### Opción A — Todo con Docker (más simple)

```bash
docker compose up -d
```

Levanta los tres servicios: MySQL 8 (`localhost:3306`), backend
(`localhost:4000`) y frontend (`localhost:5173`). Los contenedores de
backend/frontend montan el código fuente como volumen y corren con
hot-reload (`nodemon --legacy-watch` / `vite --host` con polling), así que
podés seguir editando en tu editor de siempre y los cambios se reflejan
solos. El schema y los datos de ejemplo se cargan automáticamente la
primera vez que se crea el volumen de MySQL (vía
`docker-entrypoint-initdb.d`) — no hace falta correr nada a mano.

Entrá a `http://localhost:5173/login` con alguno de los dos usuarios de
prueba (ver rol admin vs. vendedor en la sección de funcionalidades extra):

- **admin@stockmanager.com** / **admin123**
- **vendedor@stockmanager.com** / **vendedor123**

Para reconstruir las imágenes después de cambiar dependencias
(`package.json`): `docker compose up -d --build`.

### Opción B — Solo MySQL en Docker, backend/frontend con Node local

```bash
docker compose up -d mysql
```

Esto levanta únicamente MySQL. Si el volumen ya tenía datos de una corrida
anterior sin backend/frontend en Docker, cargá el schema y el seed a mano:

```bash
docker exec -i stockmanager-mysql mysql -uroot -proot --default-character-set=utf8mb4 < backend/src/db/schema.sql
docker exec -i stockmanager-mysql mysql -uroot -proot --default-character-set=utf8mb4 stockmanager < backend/src/db/seed.sql
```

(Si usás tu propio MySQL en vez de Docker: `mysql -u root -p --default-character-set=utf8mb4 < backend/src/db/schema.sql` y lo mismo con `seed.sql`.)

Backend:

```bash
cd backend
cp .env.example .env   # ajustá credenciales si no usás el docker-compose
npm install
npm run dev             # http://localhost:4000
```

Frontend:

```bash
cd frontend
cp .env.example .env    # VITE_API_URL apunta a http://localhost:4000/api por defecto
npm install
npm run dev              # http://localhost:5173
```

Con los tres servicios arriba (MySQL, backend, frontend, sea por Docker o
local), entrá a `http://localhost:5173/login` con alguno de los usuarios de
prueba (ver arriba).
