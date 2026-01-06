import api from './api';

const ML_API_URL = "https://andrerean-face-rec.hf.space";

export type PermissionStatus = 'waiting' | 'accepted' | 'denied' | 'violation' | 'valid' | 'completed';
export type AttendanceStatus = PermissionStatus | 'pending' | 'out';

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

export interface ScanLog {
  id: number;
  student_name: string;
  student_nim: string;
  attendance_status: string; // Akan berisi 'IN', 'OUT', atau 'violation'
  updated_at: string;        // Merupakan timestamp scan
}

// --- STUDENT PERMISSIONS ---
export async function getMyPermissionHistory(): Promise<Permissions[]> {
  const res = await api.get<Permissions[]>('/api/permission/my-history');
  return res.data;
}

export async function requestPermission(payload: {
  reason: string;
  start_time: string;
  end_time: string;
}) {
  const res = await api.post('/api/permission/request', payload);
  return res.data;
}

// --- ADMIN PERMISSIONS ---
export async function getAllPermissionsAdmin(): Promise<Permissions[]> {
  const res = await api.get<Permissions[]>('/api/permission/admin/all');
  return res.data;
}

export async function updatePermissionStatus(id: number, status: 'accepted' | 'denied') {
  const res = await api.patch(`/api/permission/admin/status/${id}`, { status });
  return res.data;
}

// --- LOG SCANNER ---
export async function getRecentScanLogs(): Promise<ScanLog[]> {
  const res = await api.get<{ data: ScanLog[] }>('/api/attendance/recent');
  return res.data.data; 
}