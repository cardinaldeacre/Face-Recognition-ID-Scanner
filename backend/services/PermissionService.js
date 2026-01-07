const knex = require('../config/database');

const PermissionService = {
  getAll: async () => {
    const permissions = await knex('permissions')
      .join('users', 'permissions.user_id', '=', 'users.id')
      .select(
        'permissions.*',
        'users.nama as student_name',
        'users.nim as student_nim',
        'users.prodi as student_prodi',
        'users.semester as student_semester'
      )
      .orderBy('permissions.created_at', 'desc');

    // Get attendance logs for each permission
    for (const permission of permissions) {
      const logs = await knex('attendance_logs')
        .where({ permission_id: permission.id })
        .orderBy('timestamp', 'asc');

      const inLog = logs.find(log => log.type === 'IN');
      const outLog = logs.find(log => log.type === 'OUT');

      // Set check-in and check-out status
      permission.check_in = inLog ? inLog.timestamp : null;
      permission.check_out = outLog ? outLog.timestamp : null;

      // Set attendance status
      if (permission.status === 'accepted') {
          permission.attendance_status = 'pending'; // Belum keluar sama sekali
      } else if (permission.status === 'valid') {
          permission.attendance_status = 'out'; // Sedang di luar
      } else if (permission.status === 'completed') {
          permission.attendance_status = 'completed'; // Sudah kembali
      } else {
          permission.attendance_status = permission.status; // violation/denied/waiting
      }
    }

    return permissions;
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