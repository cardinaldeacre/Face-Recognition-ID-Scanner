const express = require('express');
const router = express.Router();
const AttendanceLogService = require('../services/AttendanceLogService');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

router.get('/', authMiddleware, authorizeRole('admin'), async (req, res) => {
  try {
    const logs = await AttendanceLogService.getAll();
    return res.status(200).json(logs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error server' });
  }
});

router.delete('/:id', authMiddleware, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const itemId = parseInt(id);
    if (isNaN(itemId)) return res.status(400).json({ message: 'ID log tidak valid' });

    const deletedCount = await AttendanceLogService.delete(itemId);
    if (deletedCount === 0) return res.status(404).json({ message: 'Log tidak ditemukan' });

    return res.status(200).json({ message: 'Log berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ... import dan kode yang sudah ada ...

// TAMBAHAN: Endpoint untuk mengambil 10 log terakhir secara realtime
router.get('/recent', authMiddleware, authorizeRole('admin'), async (req, res) => {
  try {
    const logs = await AttendanceLogService.getRecent(10);

    const formattedLogs = logs.map(log => ({
      id: log.id,
      student_name: log.student_name,
      student_nim: log.student_nim,
      
      // Di DB namanya 'type', Frontend minta 'attendance_status'
      attendance_status: log.type, 
      
      // Di DB namanya 'timestamp', Frontend minta 'updated_at'
      updated_at: log.timestamp 
    }));

    return res.status(200).json({ 
        status: 'success', 
        data: formattedLogs 
    });
  } catch (error) {
    console.error("Error fetching recent logs:", error);
    return res.status(500).json({ message: 'Error server fetching recent logs' });
  }
});

// ... sisa kode delete dan lainnya ...

module.exports = router;