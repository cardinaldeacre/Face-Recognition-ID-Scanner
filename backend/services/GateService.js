const knex = require('./config/database');

const GateService = {
    identifyUser: async (incomingEmbedding) => {
        const users = await knex('users')
            .whereNotNull('face_embedding')
            .select('id', 'nama', 'face_embedding');

        let bestMatch = null;
        let minDistance = 0.6;

        users.foreach(user => {
            const distance = euclideanDistance(incomingEmbedding, user.face_embedding);

            if (distance < minDistance) {
                minDistance = distance;
                bestMatch = user
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
}

function euclideanDistance(arr1, arr2) {
    return Math.sqrt(
        arr1.reduce((sum, val, i) => sum + Math.pow(val - arr2[i], 2), 0)
    );
}

module.exports = GateService;