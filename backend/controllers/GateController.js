// controllers/GateController.js
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

        const now = new Date();
        const lastLog = await knex('attendance_logs')
            .where('user_id', user.id)
            .orderBy('timestamp', 'desc')
            .first();

        // JEDA WAKTU: Diubah menjadi sangat singkat (misal 10 detik atau 0.17 menit)
        // agar tidak dianggap error oleh user saat proses transisi status.
        if (lastLog) {
            const diffInSeconds = (now - new Date(lastLog.timestamp)) / 1000;
            if (diffInSeconds < 10) { // Jeda 10 detik
                return res.status(429).json({ 
                    message: `Scan berhasil diproses. Tunggu ${Math.ceil(10 - diffInSeconds)} detik untuk scan ulang.` 
                });
            }
        }

        const activePermission = await GateService.checkActivePermission(user.id);
        const autoType = await GateService.determineNextType(user.id, activePermission?.id);

        // 1. LOGIKA UNTUK IZIN YANG BARU DI-APPROVE (ACCEPTED)
        if (activePermission && activePermission.status === 'accepted') {
            const startTime = new Date(activePermission.start_time);
            const endTime = new Date(activePermission.end_time);
            let finalStatus = 'accepted'; 

            if (autoType === 'OUT') {
                finalStatus = now >= startTime ? 'valid' : 'violation';
            } else if (autoType === 'IN') {
                finalStatus = now <= endTime ? 'completed' : 'violation';
            }

            await knex('attendance_logs').insert({
                permission_id: activePermission.id,
                user_id: user.id,
                type: autoType,
                timestamp: now
            });

            await knex('permissions').where({ id: activePermission.id }).update({
                status: finalStatus,
                updated_at: now
            });

            return res.status(200).json({ message: `${autoType} Berhasil`, type: autoType });
        } 
        // 2. LOGIKA UNTUK MAHASISWA YANG SEDANG DI LUAR (VALID) MAU MASUK (IN)
        else if (activePermission && activePermission.status === 'valid' && autoType === 'IN') {
             const endTime = new Date(activePermission.end_time);
             const finalStatus = now <= endTime ? 'completed' : 'violation';

             await knex('attendance_logs').insert({
                permission_id: activePermission.id,
                user_id: user.id,
                type: 'IN',
                timestamp: now
            });

            await knex('permissions').where({ id: activePermission.id }).update({
                status: finalStatus,
                updated_at: now
            });

            return res.status(200).json({ message: `IN Berhasil`, type: 'IN' });
        }
        // 3. LOGIKA PELANGGARAN (TANPA IZIN ATAU IZIN TIDAK SESUAI)
        else {
            const [newViolation] = await knex('permissions').insert({
                user_id: user.id,
                status: 'violation',
                reason: 'Aktivitas tanpa izin valid (Otomatis)',
                start_time: now,
                end_time: now
            }).returning('*');

            await knex('attendance_logs').insert({
                permission_id: newViolation.id,
                user_id: user.id,
                type: autoType,
                timestamp: now
            });

            return res.status(403).json({ message: `Pelanggaran!`, type: autoType });
        }
    } catch (error) {
        console.error("🔥 Error:", error.message);
        res.status(500).json({ message: 'Error server' });
    }
});

module.exports = router;