const knex = require('../config/database');

const PermissionService = {
  getAll: async () => {
    return await knex('permissions')
      .join('users', 'permissions.user_id', '=', 'users.id')
      .select(
        'permissions.*',
        'users.nama as student_name',
        'users.nim as student_nim',
        'users.prodi as student_prodi',
        'users.semester as student_semester'
      )
      .orderBy('permissions.created_at', 'desc');
  },

  getById: async (id) => {
    return await knex('permissions').where({ id }).first();
  },

  getByUser: async (userId) => {
    return await knex('permissions')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');
  },

  create: async (userId, data) => {
    return await knex('permissions')
      .insert({
        user_id: userId,
        reason: data.reason,
        duration: data.duration ?? null,
        start_time: data.start_time,
        end_time: data.end_time,
        status: 'waiting',
      })
      .returning('*');
  },

  updateStatus: async (id, status) => {
    const [updated] = await knex('permissions')
      .where({ id })
      .update({
        status,
        updated_at: knex.fn.now(),
      })
      .returning('*');
    return updated;
  },

  delete: async (id) => {
    return await knex('permissions').where({ id }).del();
  },

  getActivePermission: async (userId) => {
    const now = new Date();
    return await knex('permissions')
      .where({ user_id: userId, status: 'accepted' })
      .where('start_time', '<=', now) // Sudah masuk waktu boleh keluar
      .where('end_time', '>=', now) // Belum melewati batas kembali
      .first();
  },
};

module.exports = PermissionService;
