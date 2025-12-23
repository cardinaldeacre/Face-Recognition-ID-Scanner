/**
 * @swagger
 * /api/gate/screen:
 *   post:
 *     summary: Screening wajah di gerbang
 *     tags: [Gate]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               embedding:
 *                 type: array
 *                 items:
 *                   type: number
 *                 example: [0.123, -0.456, 0.789, 0.101]
 *     responses:
 *       200:
 *         description: Akses diterima (Authorized)
 *       403:
 *         description: Akses ditolak (Violation)
 *       404:
 *         description: Wajah tidak dikenali
 */
