const express = require('express');
const router = express.Router();
const UserService = require('../services/UserService');
const { authorizeRole, authMiddleware } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const knex = require('../config/database');

router.post('/login', async (req, res) => {
  const { nim, password } = req.body;

  if (!nim || !password) {
    return res.status(400).json({ message: 'Semua kolom harus diisi' });
  }

  try {
    const user = await UserService.login(nim, password);
    if (!user) {
      return res.status(401).json({ message: 'NIM atau password salah' });
    }

    delete user.password;

    // JWT
    const accessToken = jwt.sign(
      { id: user.id, nim: user.nim, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '6h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id, nim: user.nim, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    const existingToken = await knex('refresh_token')
      .where({ user_id: user.id })
      .first();

    if (existingToken) {
      await knex('refresh_token')
        .where({ user_id: user.id })
        .update({ token: refreshToken });
    } else {
      await knex('refresh_token').insert({
        token: refreshToken,
        user_id: user.id
      });
    }

    // PERBAIKAN: Konfigurasi Cookie agar bisa terbaca oleh Vercel (Cross-Domain)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true, // Wajib true untuk sameSite 'none' di production
      sameSite: 'none', // Diperlukan agar cookie bisa dikirim antar domain berbeda
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      message: 'Login Berhasil',
      user: {
        id: user.id,
        nama: user.nama,
        nim: user.nim,
        role: user.role
      },
      accessToken,
      refreshToken,
      role: user.role
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error server' });
  }
});

router.post('/refresh-token', async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token tidak ditemukan' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const storedToken = await knex('refresh_token')
      .where({ token: refreshToken })
      .first();

    if (!storedToken) {
      return res
        .status(403)
        .json({ message: 'Refresh token tidak valid (telah dicabut)' });
    }

    const newAccessToken = jwt.sign(
      { id: decoded.id, nim: decoded.nim, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    console.error(error);
    res
      .status(403)
      .json({ message: 'Refresh token tidak valid atau kadaluarsa' });
  }
});

// PERBAIKAN: Logout dilepaskan dari authMiddleware agar user bisa logout meski token expired
router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  try {
    if (refreshToken) {
      await knex('refresh_token').where({ token: refreshToken }).del();
    }

    // PERBAIKAN: clearCookie harus memiliki atribut yang sama dengan saat set cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });

    res.status(200).json({ message: 'Logout berhasil' });
  } catch (error) {
    console.error(error);
    // Jika DB gagal, tetap bersihkan cookie di sisi klien agar user keluar dari aplikasi
    res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'none' });
    res.status(500).json({ message: 'Error server' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await UserService.getAll();
    return res.status(200).json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error server' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nama, nim, password, prodi, semester, face_embedding, role } = req.body;

    if (!nama || !nim || !password) {
      return res.status(400).json({ message: 'Nama, NIM, dan password harus diisi' });
    }

    const newUser = await UserService.create({
      nama, nim, password, prodi, semester,
      role: role ? 'student' : null,
      face_embedding: face_embedding ? JSON.stringify(face_embedding) : null
    });

    res.status(201).json({ message: 'User berhasil dibuat', data: newUser });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'NIM sudah terdaftar' });

    console.error(error);
    res.status(500).json({ message: 'Error server' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  if (Object.keys(updatedData).length === 0) {
    return res.status(400).json({ message: 'Data yang akan diupdate tidak boleh kosong' });
  }

  try {
    const userId = parseInt(id);

    if (updatedData.face_embedding) {
      updatedData.face_embedding = JSON.stringify(updatedData.face_embedding);
    }

    const updateUser = await UserService.update(userId, updatedData);

    if (!updateUser) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.status(200).json({ message: 'User berhasil diedit', data: updateUser });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'NIM sudah digunakan.' });
    }

    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'ID user tidak valid' });
    }

    const deletedCount = await UserService.delete(userId);

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    return res.status(200).json({ message: 'User berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;