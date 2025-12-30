const knex = require('../config/database');

const GateService = {
    identifyUser: async (incomingEmbedding) => {
        const users = await knex('users')
            .whereNotNull('face_embedding')
            .select('id', 'nama', 'face_embedding')
            .timeout(5000)

        let bestMatch = null;
        let minDistance = 0.7;

        users.forEach(user => {
            const storedEmbedding = typeof user.face_embedding === 'string'
                ? JSON.parse(user.face_embedding)
                : user.face_embedding;

            const distance = euclideanDistance(incomingEmbedding, storedEmbedding);

            if (distance < minDistance) {
                minDistance = distance;
                bestMatch = user;
            }
        });

        return bestMatch;
    },

    checkActivePermission: async (userId) => {
        const now = new Date();
        return await knex('permissions')
            .where({ user_id: userId, status: 'accepted' })
            .where('start_time', '<=', now)
            .where('end_time', '>=', now)
            .first();
    },

    determineNextType: async (userId, permissionId) => {
        // Get last log for THIS specific permission only
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

function euclideanDistance(arr1, arr2) {
    if (!arr1 || !arr2 || arr1.length !== arr2.length) return 1.0;
    return Math.sqrt(
        arr1.reduce((sum, val, i) => sum + Math.pow(val - arr2[i], 2), 0)
    );
}

module.exports = GateService;