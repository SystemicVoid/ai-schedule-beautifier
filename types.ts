
export interface ScheduleEvent {
  id: string;
  start: Date;
  end: Date;
  title: string;
  description: string;
  capacity: number;
  total: number;
  waiting: number;
  price: number;
  color: string;
}
   