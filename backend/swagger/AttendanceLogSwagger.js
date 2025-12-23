/**
 * @swagger
 * tags:
 *   - name: AttendanceLogs
 *     description: Monitoring log keluar-masuk siswa secara real-time
 */

/**
 * @swagger
 * /api/attendance:
 *   get:
 *     summary: Mendapatkan semua log kehadiran (Admin Only)
 *     tags: [AttendanceLogs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil semua log
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nama:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [IN, OUT]
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 */

/**
 * @swagger
 * /api/attendance/{id}:
 *   delete:
 *     summary: Menghapus log kehadiran tertentu (Admin Only)
 *     tags: [AttendanceLogs]
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
 *         description: Log berhasil dihapus
 *       404:
 *         description: Log tidak ditemukan
 */
