const express = require('express');
const router = express.Router();
const GateService = require('../services/GateService');
const knex = require('../config/database');

router.post('/screen', async (req, res) => {
    try {
        const { nim_detected } = req.body;
        if (!nim_detected) return res.status(400).json({ message: 'NIM Kosong' });

        const user = await knex('users').where('nim', nim_detected.toString().trim()).first();
        if (!user) return res.status(404).json({ message: 'Mahasiswa tidak terdaftar' });

        // 1. Cek Jeda Scan (5 Menit)
        const lastLog = await knex('attendance_logs').where('user_id', user.id).orderBy('timestamp', 'desc').first();
        const now = new Date();

        if (lastLog) {
            const diffInMinutes = (now - new Date(lastLog.timestamp)) / (1000 * 60);
            if (diffInMinutes < 5) {
                return res.status(429).json({ message: `Tunggu ${Math.ceil(5 - diffInMinutes)} menit untuk scan ulang.` });
            }
        }

        // 2. Cek Izin & Tentukan Tipe (OUT/IN)
        const activePermission = await GateService.checkActivePermission(user.id);
        const autoType = await GateService.determineNextType(user.id, activePermission?.id);

        if (activePermission) {
            const startTime = new Date(activePermission.start_time);
            const endTime = new Date(activePermission.end_time);
            let finalStatus = activePermission.status;
            let reasonUpdate = activePermission.reason;

            // --- LOGIKA VALIDASI WAKTU ---
            if (autoType === 'OUT') {
                if (now < startTime) {
                    finalStatus = 'violation';
                    reasonUpdate = `Pelanggaran: Keluar mendahului jadwal (${activePermission.reason})`;
                } else {
                    finalStatus = 'accepted'; // Tetap accepted jika keluar tepat waktu
                }
            } else if (autoType === 'IN') {
                if (now > endTime) {
                    finalStatus = 'violation';
                    reasonUpdate = `Pelanggaran: Kembali melewati batas waktu (${activePermission.reason})`;
                } else {
                    finalStatus = 'completed'; // Sukses kembali tepat waktu
                }
            }

            // 3. Simpan Log
            await knex('attendance_logs').insert({
                permission_id: activePermission.id,
                user_id: user.id,
                type: autoType,
                timestamp: now
            });

            // 4. Update Status di Tabel Permission
            await knex('permissions').where({ id: activePermission.id }).update({
                status: finalStatus,
                reason: reasonUpdate,
                updated_at: now
            });

            return res.status(200).json({
                message: `${autoType} Berhasil. Nama: ${user.nama}. Status: ${finalStatus}`,
                type: autoType
            });

        } else {
            // --- LOGIKA KELUAR TANPA IZIN (VIOLATION) ---
            const [violation] = await knex('permissions').insert({
                user_id: user.id,
                status: 'violation',
                reason: `Terdeteksi melakukan ${autoType} tanpa izin resmi.`,
                start_time: now,
                end_time: now,
                created_at: now,
                updated_at: now
            }).returning('*');

            await knex('attendance_logs').insert({
                permission_id: violation.id,
                user_id: user.id,
                type: autoType,
                timestamp: now
            });

            return res.status(403).json({ message: `Pelanggaran! ${autoType} tanpa izin.`, type: autoType });
        }
    } catch (error) {
        console.error("🔥 GateController Error:", error.message);
        res.status(500).json({ message: 'Error server', detail: error.message });
    }
});

module.exports = router;