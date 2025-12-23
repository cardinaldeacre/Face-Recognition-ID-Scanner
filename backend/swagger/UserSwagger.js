/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Manajemen pengguna dan autentikasi
 */

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Login pengguna
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nim:
 *                 type: string
 *                 example: "2201001"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login berhasil
 *       401:
 *         description: NIM atau password salah
 */

/**
 * @swagger
 * /api/user/refresh-token:
 *   post:
 *     summary: Memperbarui Access Token menggunakan Refresh Token
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Access Token baru berhasil dibuat
 *       403:
 *         description: Refresh token tidak valid atau kadaluarsa
 */

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     summary: Logout pengguna dan hapus session
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout berhasil
 */

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Mendapatkan semua daftar user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daftar user berhasil diambil
 *
 *   post:
 *     summary: Membuat user baru (Registrasi)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama:
 *                 type: string
 *               nim:
 *                 type: string
 *               password:
 *                 type: string
 *               prodi:
 *                 type: string
 *               semester:
 *                 type: integer
 *               role:
 *                 type: string
 *                 enum: [admin, student]
 *               face_embedding:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       201:
 *         description: User berhasil dibuat
 *       409:
 *         description: NIM sudah terdaftar
 */

/**
 * @swagger
 * /api/user/{id}:
 *   put:
 *     summary: Update data user berdasarkan ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: User berhasil diupdate
 *       404:
 *         description: User tidak ditemukan
 *
 *   delete:
 *     summary: Menghapus user berdasarkan ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User berhasil dihapus
 *       404:
 *         description: User tidak ditemukan
 */
