/**
 * @swagger
 * tags:
 *   - name: Permissions
 *     description: Manajemen perizinan keluar kampus
 */

/**
 * @swagger
 * /api/permission/my-history:
 *   get:
 *     summary: Mendapatkan riwayat izin siswa yang sedang login
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daftar riwayat izin berhasil diambil
 *       401:
 *         description: Tidak terautentikasi
 */

/**
 * @swagger
 * /api/permission/request:
 *   post:
 *     summary: Siswa mengajukan perizinan baru
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *               - start_time
 *               - end_time
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Urusan keluarga mendesak"
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-12-25T13:00:00Z"
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-12-25T17:00:00Z"
 *     responses:
 *       201:
 *         description: Permintaan berhasil dibuat
 *       400:
 *         description: Input tidak valid (waktu salah atau kolom kosong)
 */

/**
 * @swagger
 * /api/permission/admin/all:
 *   get:
 *     summary: Admin melihat semua pengajuan izin (Admin Only)
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daftar semua izin berhasil diambil
 */

/**
 * @swagger
 * /api/permission/admin/status/{id}:
 *   patch:
 *     summary: Admin menyetujui atau menolak izin (Admin Only)
 *     tags: [Permissions]
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
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, denied]
 *     responses:
 *       200:
 *         description: Status berhasil diperbarui
 *       404:
 *         description: ID izin tidak ditemukan
 */

/**
 * @swagger
 * /api/permission/{id}:
 *   delete:
 *     summary: Menghapus data perizinan
 *     tags: [Permissions]
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
 *         description: Data berhasil dihapus
 *       404:
 *         description: Data tidak ditemukan
 */
