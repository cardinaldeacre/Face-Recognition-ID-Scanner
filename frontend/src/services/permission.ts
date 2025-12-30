// import type { PermissionList } from '../types/api';
import api from './api';

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

// admin

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
