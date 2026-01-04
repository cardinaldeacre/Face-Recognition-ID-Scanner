// import type { PermissionList } from '../types/api';
import api from './api';

const ML_API_URL = "https://andrerean-face-rec.hf.space";

export type PermissionStatus = 'waiting' | 'accepted' | 'denied' | 'violation';
export type AttendanceStatus = 'waiting' | 'accepted' | 'denied' | 'violation' | 'pending' | 'out' | 'completed';

export interface Permissions {
  id: number;
  user_id: number;
  reason: string;
  duration: number | null;
  start_time: string;
  end_time: string;
  status: PermissionStatus;

  student_name?: string;
  student_nim?: string;
  student_prodi?: string;
  student_semester?: number;

  check_in?: string | null;
  check_out?: string | null;
  attendance_status?: AttendanceStatus;
}

// --- PERBAIKAN DI SINI ---
export interface ScanLog {
  id: number;
  student_name: string;
  student_nim: string;
  // Ubah 'type' menjadi 'attendance_status'
  attendance_status: 'check_in' | 'check_out' | 'rejected'; 
  // Ubah 'timestamp' menjadi 'updated_at'
  updated_at: string; 
}
// -------------------------

// --- STUDENT PERMISSIONS ---

export async function getMyPermissionHistory(): Promise<Permissions[]> {
  const res = await api.get<Permissions[]>('/api/permission/my-history');
  return res.data;
}

export async function requestPermission(payload: {
  reason: string;
  start_time: string;
  end_time: string;
  duration?: number;
}) {
  const res = await api.post('/api/permission/request', payload);
  return res.data;
}

// --- ADMIN PERMISSIONS ---

export async function getAllPermissionsAdmin(): Promise<Permissions[]> {
  const res = await api.get<Permissions[]>('/api/permission/admin/all');
  return res.data;
}

export async function updatePermissionStatus(
  id: number,
  status: 'accepted' | 'denied'
) {
  const res = await api.patch(`/api/permission/admin/status/${id}`, { status });
  return res.data;
}

// --- FUNGSI FETCH LOG SCANNER (ADMIN) ---
export async function getRecentScanLogs(): Promise<ScanLog[]> {
  const res = await api.get('/api/attendance/recent');
  // Pastikan backend Anda mengembalikan properti: 
  // id, student_name, student_nim, attendance_status, updated_at
  return res.data.data; 
}

// --- FACE RECOGNITION SERVICE (PYTHON) ---

export async function verifyAttendance(imageBlob: Blob) {
  const formData = new FormData();
  formData.append('image', imageBlob, 'capture.jpg'); 

  try {
    const response = await fetch(`${ML_API_URL}/scan`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`ML Server error: ${response.status}`);
    }

    const data = await response.json();
    return data; 
  } catch (error) {
    console.error("Error verifying attendance:", error);
    throw error;
  }
}