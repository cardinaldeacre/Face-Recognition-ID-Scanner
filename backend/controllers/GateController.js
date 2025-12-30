const express = require('express');
const router = express.Router();
const GateService = require('../services/GateService');
const knex = require('../config/database');

router.post('/screen', async (req, res) => {
    try {
        const { embedding } = req.body;

        if (!embedding) {
            return res.status(400).json({ message: 'Data scan tidak lengkap' });
        }

        const user = await GateService.identifyUser(embedding);

        if (!user) {
            return res.status(404).json({ message: 'Wajah ga nemu' });
        }

        const activePermission = await GateService.checkActivePermission(user.id);

        if (activePermission) {
            console.log('✅ Active Permission Found:', {
                userId: user.id,
                permissionId: activePermission.id,
                status: activePermission.status,
                startTime: activePermission.start_time,
                endTime: activePermission.end_time
            });

            // Determine type based on THIS permission's logs
            const autoType = await GateService.determineNextType(user.id, activePermission.id);

            console.log('📍 Auto Type:', autoType);

            await knex('attendance_logs').insert({
                permission_id: activePermission.id,
                user_id: user.id,
                type: autoType
            });

            return res.status(200).json({
                message: `Akses diterima. ${autoType}, ${user.nama}!`,
                type: autoType
            });
        } else {
            console.log('❌ No Active Permission for user:', user.id, user.nama);

            // Check all permissions for debugging
            const allPermissions = await knex('permissions')
                .where({ user_id: user.id })
                .select('*');

            console.log('📋 All Permissions for user:', allPermissions.map(p => ({
                id: p.id,
                status: p.status,
                start_time: p.start_time,
                end_time: p.end_time
            })));

            // No active permission - create violation
            const autoType = await GateService.determineNextType(user.id, null);

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
                type: autoType
            });

            return res.status(403).json({
                message: `Pelanggaran! Anda mencoba ${autoType} tanpa izin.`,
                reason: 'No active permission'
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error server' })
    }
})

module.exports = router;
