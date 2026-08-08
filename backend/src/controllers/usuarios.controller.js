import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

const ROLES = ['admin', 'vendedor'];

export const listUsuarios = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, email, nombre, rol, created_at FROM usuarios ORDER BY nombre'
  );
  res.json(rows);
});

export const createUsuario = asyncHandler(async (req, res) => {
  const { email, password, nombre, rol } = req.body;

  if (!email || !email.trim()) throw new ApiError(400, 'El email es requerido');
  if (!password || password.length < 6) {
    throw new ApiError(400, 'La contraseña debe tener al menos 6 caracteres');
  }
  if (!nombre || !nombre.trim()) throw new ApiError(400, 'El nombre es requerido');
  if (!ROLES.includes(rol)) throw new ApiError(400, 'Rol inválido (admin o vendedor)');

  const [existentes] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email.trim()]);
  if (existentes[0]) throw new ApiError(400, 'Ya existe un usuario con ese email');

  const passwordHash = await bcrypt.hash(password, 10);

  const [result] = await pool.query(
    'INSERT INTO usuarios (email, password_hash, nombre, rol) VALUES (?, ?, ?, ?)',
    [email.trim(), passwordHash, nombre.trim(), rol]
  );

  const [rows] = await pool.query('SELECT id, email, nombre, rol, created_at FROM usuarios WHERE id = ?', [
    result.insertId,
  ]);
  res.status(201).json(rows[0]);
});
