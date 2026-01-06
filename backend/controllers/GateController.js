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

        // 1. Jeda Scan 5 Menit SPESIFIK per User (Wajah yang sama)
        // Kita mencari log terakhir yang memiliki user_id yang sama dengan user yang terdeteksi
        const lastLog = await knex('attendance_logs')
            .where('user_id', user.id)
            .orderBy('timestamp', 'desc')
            .first();
            
        const now = new Date();

        if (lastLog) {
            const diffInMinutes = (now - new Date(lastLog.timestamp)) / (1000 * 60);
            // Jika orang yang sama scan lagi sebelum 5 menit, maka ditolak
            if (diffInMinutes < 5) { 
                return res.status(429).json({ 
                    message: `Halo ${user.nama}, Anda baru saja melakukan scan. Tunggu ${Math.ceil(5 - diffInMinutes)} menit untuk scan ulang.` 
                });
            }
        }

        // 2. Cek Izin & Tentukan Arah (OUT/IN)
        const activePermission = await GateService.checkActivePermission(user.id);
        const autoType = await GateService.determineNextType(user.id, activePermission?.id);

        // --- LOGIKA BERDASARKAN TABEL STATUS ---

        // KONDISI: Ada izin dan sudah di-ACCEPT oleh Admin
        if (activePermission && activePermission.status === 'accepted') {
            const startTime = new Date(activePermission.start_time);
            const endTime = new Date(activePermission.end_time);
            
            let finalStatus = 'accepted'; 
            let reasonUpdate = activePermission.reason;

            if (autoType === 'OUT') {
                if (now >= startTime) {
                    finalStatus = 'valid'; // Berubah jadi valid jika scan OUT >= start_time
                } else {
                    finalStatus = 'violation'; // Pelanggaran jika scan OUT < start_time
                    reasonUpdate = `Violation: Keluar terlalu cepat.`;
                }
            } else if (autoType === 'IN') {
                if (now <= endTime) {
                    finalStatus = 'completed'; // Selesai jika scan IN <= end_time
                } else {
                    finalStatus = 'violation'; // Pelanggaran jika scan IN > end_time
                    reasonUpdate = `Violation: Terlambat kembali.`;
                }
            }

            // Simpan ke Log
            await knex('attendance_logs').insert({
                permission_id: activePermission.id,
                user_id: user.id,
                type: autoType,
                timestamp: now
            });

            // Update status di tabel permissions
            await knex('permissions').where({ id: activePermission.id }).update({
                status: finalStatus,
                reason: reasonUpdate,
                updated_at: now
            });

            return res.status(200).json({ 
                message: `${autoType} Berhasil. Status: ${finalStatus}`,
                type: autoType,
                status: finalStatus
            });
        } 
        
        // KONDISI: Transisi dari 'valid' ke 'completed' atau 'violation' saat masuk kembali (IN)
        else if (activePermission && activePermission.status === 'valid' && autoType === 'IN') {
             const endTime = new Date(activePermission.end_time);
             let finalStatus = now <= endTime ? 'completed' : 'violation';
             let reasonUpdate = finalStatus === 'violation' ? `Violation: Terlambat kembali.` : activePermission.reason;

             await knex('attendance_logs').insert({
                permission_id: activePermission.id,
                user_id: user.id,
                type: autoType,
                timestamp: now
            });

            await knex('permissions').where({ id: activePermission.id }).update({
                status: finalStatus,
                reason: reasonUpdate,
                updated_at: now
            });

            return res.status(200).json({ message: `IN Berhasil. Status: ${finalStatus}`, type: 'IN' });
        }

        // KONDISI: Belum di-acc, Ditolak, atau Tidak ada izin (Violation)
        else {
            let violationReason = activePermission && activePermission.status === 'rejected' 
                ? `Mencoba ${autoType} padahal izin ditolak.` 
                : (activePermission && activePermission.status === 'waiting' 
                    ? `Mencoba ${autoType} padahal izin belum disetujui (Waiting).`
                    : `Mencoba ${autoType} tanpa izin resmi.`);

            const [newViolation] = await knex('permissions').insert({
                user_id: user.id,
                status: 'violation',
                reason: violationReason,
                start_time: now,
                end_time: now,
                created_at: now,
                updated_at: now
            }).returning('*');

            await knex('attendance_logs').insert({
                permission_id: newViolation.id,
                user_id: user.id,
                type: autoType,
                timestamp: now
            });

            return res.status(403).json({ message: `Pelanggaran! ${autoType} tidak diizinkan.`, type: autoType });
        }
    } catch (error) {
        console.error("🔥 GateController Error:", error.message);
        res.status(500).json({ message: 'Error server', detail: error.message });
    }
});

module.exports = router;