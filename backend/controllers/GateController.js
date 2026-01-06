const express = require('express');
const router = express.Router();
const GateService = require('../services/GateService');
const knex = require('../config/database');

router.post('/screen', async (req, res) => {
    try {
        // PERBAIKAN: Ambil 'nim_detected' (sesuai kiriman Pipedream/HuggingFace)
        const { nim_detected } = req.body;

        if (!nim_detected) {
            console.log('⚠️ Request masuk tanpa NIM');
            return res.status(400).json({ message: 'Data scan tidak lengkap' });
        }

        console.log(`📡 Memproses scan untuk NIM: ${nim_detected}`);

        // PERBAIKAN: Cari user berdasarkan NIM langsung
        // Karena AI sudah melakukan tugas pengenalan wajah (Face Recognition)
        const user = await knex('users').where({ nim: nim_detected }).first();

        if (!user) {
            console.log(`❌ NIM ${nim_detected} tidak ditemukan di database.`);
            return res.status(404).json({ message: 'Mahasiswa tidak terdaftar' });
        }

        const activePermission = await GateService.checkActivePermission(user.id);

        if (activePermission) {
            console.log('✅ Izin Aktif Ditemukan:', {
                userId: user.id,
                nama: user.nama,
                permissionId: activePermission.id
            });

            // Tentukan tipe (IN/OUT) secara otomatis
            const autoType = await GateService.determineNextType(user.id, activePermission.id);

            await knex('attendance_logs').insert({
                permission_id: activePermission.id,
                user_id: user.id,
                type: autoType
            });

            return res.status(200).json({
                message: `Akses diterima. ${autoType === 'IN' ? 'Selamat Datang' : 'Selamat Jalan'}, ${user.nama}!`,
                type: autoType
            });
        } else {
            console.log('❌ Tidak ada izin aktif untuk:', user.nama);

            // Jika tidak ada izin aktif, buat log pelanggaran (violation)
            const autoType = await GateService.determineNextType(user.id, null);

            const [violation] = await knex('permissions').insert({
                user_id: user.id,
                status: 'violation',
                reason: `Mencoba ${autoType} tanpa izin resmi (Terdeteksi AI).`,
                start_time: knex.fn.now(),
                end_time: knex.fn.now()
            }).returning('*');

            await knex('attendance_logs').insert({
                permission_id: violation.id,
                user_id: user.id,
                type: autoType
            });

            return res.status(403).json({
                message: `Pelanggaran! Anda mencoba ${autoType === 'IN' ? 'Masuk' : 'Keluar'} tanpa izin.`,
                reason: 'No active permission'
            });
        }
    } catch (error) {
        console.error("🔥 GateController Error:", error);
        res.status(500).json({ message: 'Error server' });
    }
});

module.exports = router;