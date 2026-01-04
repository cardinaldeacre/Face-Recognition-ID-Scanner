const knex = require('../config/database');

const AttendanceLogService = {
  getAll: async () => {
    return await knex('attendance_logs').select('*').orderBy('created_at', 'desc');
  },

  async getRecent(limit = 10) {
    try {
      const logs = await knex('attendance_logs')
        .join('users', 'attendance_logs.user_id', 'users.id') 
        .select(
          'attendance_logs.id',
          'attendance_logs.type',       // Kolom 'type' (isinya check_in/check_out/violation)
          'attendance_logs.timestamp',  // Kolom 'timestamp' (Waktu scan)
          'users.nama as student_name', // Ambil nama dari tabel users
          'users.nim as student_nim'    // Ambil nim dari tabel users
        )
        // PENTING: Urutkan berdasarkan 'timestamp'
        .orderBy('attendance_logs.timestamp', 'desc') 
        .limit(limit);

      return logs;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    return await knex('attendance_logs').where({ id }).del();
  }
};

module.exports = AttendanceLogService;