import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

const ROLES = ['admin', 'seller'];

export const listUsers = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, email, name, role, created_at FROM users ORDER BY name'
  );
  res.json(rows);
});

export const createUser = asyncHandler(async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email || !email.trim()) throw new ApiError(400, 'Email is required');
  if (!password || password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters long');
  }
  if (!name || !name.trim()) throw new ApiError(400, 'Name is required');
  if (!ROLES.includes(role)) throw new ApiError(400, 'Invalid role (admin or seller)');

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.trim()]);
  if (existing[0]) throw new ApiError(400, 'A user with that email already exists');

  const passwordHash = await bcrypt.hash(password, 10);

  const [result] = await pool.query(
    'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
    [email.trim(), passwordHash, name.trim(), role]
  );

  const [rows] = await pool.query('SELECT id, email, name, role, created_at FROM users WHERE id = ?', [
    result.insertId,
  ]);
  res.status(201).json(rows[0]);
});
