const knex = require('../config/database');

const GateService = {
    /**
     * Mencari izin yang sedang aktif untuk user tertentu.
     * Izin dianggap aktif jika statusnya 'accepted' (baru disetujui) 
     * atau 'valid' (mahasiswa sudah scan keluar dan sedang di luar).
     */
    checkActivePermission: async (userId) => {
        const now = new Date();
        return await knex('permissions')
            .where({ user_id: userId })
            // Hanya status 'accepted' dan 'valid' yang bisa digunakan untuk scan
            .whereIn('status', ['accepted', 'valid']) 
            .where('start_time', '<=', now) // Izin sudah mulai
            .where('end_time', '>=', now)   // Izin belum berakhir
            .orderBy('created_at', 'desc')
            .first();
    },

    /**
     * Menentukan apakah mahasiswa seharusnya melakukan scan 'OUT' atau 'IN'.
     */
    determineNextType: async (userId, permissionId) => {
        // Jika tidak ada ID izin (kasus pelanggaran), default adalah mencoba keluar
        if (!permissionId) return 'OUT';

        // Ambil log terakhir untuk izin spesifik ini
        const lastLog = await knex('attendance_logs')
            .where({ user_id: userId, permission_id: permissionId })
            .orderBy('timestamp', 'desc')
            .first();

        /**
         * Logika Arah:
         * 1. Jika belum pernah scan (lastLog null) -> Harus keluar (OUT).
         * 2. Jika scan terakhir adalah masuk (IN) -> Arah berikutnya keluar (OUT).
         * 3. Jika scan terakhir adalah keluar (OUT) -> Arah berikutnya masuk (IN).
         */
        if (!lastLog || lastLog.type === 'IN') {
            return 'OUT'; //
        }

        return 'IN'; //
    }
}

module.exports = GateService;