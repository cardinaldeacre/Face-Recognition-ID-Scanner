const knex = require('../config/database');

const GateService = {
    // Fungsi identifyUser dihapus karena identifikasi sekarang lewat NIM dari AI Python

    checkActivePermission: async (userId) => {
        const now = new Date();
        // Mencari izin yang sudah diterima (accepted) atau yang sedang berjalan (out/pending)
        return await knex('permissions')
            .where({ user_id: userId })
            .whereIn('status', ['accepted', 'pending']) 
            .where('start_time', '<=', now)
            .where('end_time', '>=', now)
            .orderBy('created_at', 'desc')
            .first();
    },

    determineNextType: async (userId, permissionId) => {
        if (!permissionId) return 'OUT';

        // Cek log terakhir untuk izin ini
        const lastLog = await knex('attendance_logs')
            .where({ user_id: userId, permission_id: permissionId })
            .orderBy('timestamp', 'desc')
            .first();

        // Alur: Jika belum pernah log atau log terakhir Masuk (IN), maka sekarang Keluar (OUT)
        // Jika log terakhir Keluar (OUT), maka sekarang Masuk (IN)
        if (!lastLog || lastLog.type === 'IN') {
            return 'OUT';
        }

        return 'IN';
    }
}

module.exports = GateService;