const express = require('express');
const router = express.Router();
const GateService = require('../services/GateService');
const knex = require('../config/database');

router.post('/screen', async (req, res) => {
    try {
        // 1. SESUAIKAN: Ambil 'nim_detected' dari Pipedream (bukan embedding)
        const { nim_detected } = req.body;

        if (!nim_detected) {
            return res.status(400).json({ message: 'Data scan tidak lengkap (NIM Kosong)' });
        }

        // 2. SESUAIKAN: Cari user berdasarkan NIM (Pastikan NIM di DB tidak ada spasi)
        // Kita gunakan .trim() atau query yang fleksibel untuk menghindari 404
        const user = await knex('users')
            .where('nim', nim_detected.toString().trim())
            .first();

        if (!user) {
            // Ini yang menyebabkan error 404 di Pipedream Anda
            console.log(`❌ NIM tidak ditemukan di DB: ${nim_detected}`);
            return res.status(404).json({ message: 'Mahasiswa tidak terdaftar' });
        }

        const activePermission = await GateService.checkActivePermission(user.id);

        if (activePermission) {
            console.log('✅ Active Permission Found:', { userId: user.id, nama: user.nama });

            const autoType = await GateService.determineNextType(user.id, activePermission.id);

            // 3. SESUAIKAN: Tambahkan timestamp manual jika DB tidak auto-generate
            await knex('attendance_logs').insert({
                permission_id: activePermission.id,
                user_id: user.id,
                type: autoType,
                timestamp: knex.fn.now() 
            });

            return res.status(200).json({
                message: `Akses diterima. ${autoType}, ${user.nama}!`,
                type: autoType
            });
        } else {
            console.log('❌ No Active Permission for user:', user.nama);

            const autoType = await GateService.determineNextType(user.id, null);

            // Jika tidak ada izin, buat status 'violation'
            const [violation] = await knex('permissions').insert({
                user_id: user.id,
                status: 'violation',
                reason: `Terdeteksi mencoba melakukan ${autoType} tanpa izin resmi.`,
                start_time: knex.fn.now(),
                end_time: knex.fn.now()
            }).returning('*');

            await knex('attendance_logs').insert({
                permission_id: violation.id,
                user_id: user.id,
                type: autoType,
                timestamp: knex.fn.now()
            });

            return res.status(403).json({
                message: `Pelanggaran! Anda mencoba ${autoType} tanpa izin.`,
                reason: 'No active permission'
            });
        }
    } catch (error) {
        console.error("🔥 GateController Error:", error);
        res.status(500).json({ message: 'Error server' });
    }
});

module.exports = router;