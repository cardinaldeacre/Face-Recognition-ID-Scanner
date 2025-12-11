export interface Application {
  id: number;
  student: string;
  date: string;
  purpose: string;
  destination?: string;
  status: 'approve' | 'waiting';
}

export interface EventItem {
  name: string;
  details: string;
}
