const knex = require('../config/database');

const GateService = {
    checkActivePermission: async (userId) => {
        const now = new Date();
        return await knex('permissions')
            .where({ user_id: userId })
            // Perbaikan: Hapus 'waiting'. Hanya 'accepted' (baru disetujui) 
            // dan 'valid' (sedang di luar) yang dianggap izin aktif untuk scan.
            .whereIn('status', ['accepted', 'valid']) 
            .where('start_time', '<=', now)
            .where('end_time', '>=', now)
            .orderBy('created_at', 'desc')
            .first();
    },

    determineNextType: async (userId, permissionId) => {
        if (!permissionId) return 'OUT';

        const lastLog = await knex('attendance_logs')
            .where({ user_id: userId, permission_id: permissionId })
            .orderBy('timestamp', 'desc')
            .first();

        if (!lastLog || lastLog.type === 'IN') {
            return 'OUT';
        }

        return 'IN';
    }
}

module.exports = GateService;