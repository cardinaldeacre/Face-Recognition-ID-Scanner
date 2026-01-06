router.post('/screen', async (req, res) => {
    try {
        const { nim_detected } = req.body;
        if (!nim_detected) {
            return res.status(400).json({ message: 'Data scan tidak lengkap (NIM Kosong)' });
        }

        const user = await knex('users')
            .where('nim', nim_detected.toString().trim())
            .first();

        if (!user) {
            return res.status(404).json({ message: 'Mahasiswa tidak terdaftar' });
        }

        const activePermission = await GateService.checkActivePermission(user.id);

        if (activePermission) {
            const autoType = await GateService.determineNextType(user.id, activePermission.id);
            const now = knex.fn.now();

            // 1. Masukkan ke Attendance Logs
            await knex('attendance_logs').insert({
                permission_id: activePermission.id,
                user_id: user.id,
                type: autoType,
                timestamp: now 
            });

            // --- PERBAIKAN: Update tabel Permissions agar waktu IN/OUT muncul di Dashboard ---
            const updateData = {};
            if (autoType === 'OUT') {
                updateData.check_out = now;
                updateData.attendance_status = 'out'; // Status saat mahasiswa di luar
            } else {
                updateData.check_in = now;
                updateData.attendance_status = 'completed'; // Status saat mahasiswa sudah kembali
            }

            await knex('permissions')
                .where({ id: activePermission.id })
                .update(updateData);
            // -------------------------------------------------------------------------

            return res.status(200).json({
                message: `Akses diterima. ${autoType}, ${user.nama}!`,
                type: autoType
            });
        } else {
            // Logika Violation (Tetap sama)
            const autoType = await GateService.determineNextType(user.id, null);
            const [violation] = await knex('permissions').insert({
                user_id: user.id,
                status: 'violation',
                reason: `Terdeteksi mencoba melakukan ${autoType} tanpa izin resmi.`,
                start_time: knex.fn.now(),
                end_time: knex.fn.now(),
                attendance_status: autoType === 'OUT' ? 'out' : 'completed'
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