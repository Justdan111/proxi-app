import apiClient from './client';

export type EventType = 'triggered' | 'created' | 'deleted' | 'toggled';

export interface Activity {
  id: string;
  userId: string;
  reminderId: string;
  reminderTitle: string;
  location: string;
  icon: string;
  eventType: EventType;
  triggeredAt: string;
}

export interface LogActivityPayload {
  reminderId: string;
  reminderTitle: string;
  location: string;
  icon: string;
  eventType: EventType;
}

export const activitiesApi = {
  getAll: async (): Promise<Activity[]> => {
    const { data } = await apiClient.get('/api/activities');
    return data.data;
  },

  log: async (payload: LogActivityPayload): Promise<Activity> => {
    const { data } = await apiClient.post('/api/activities', payload);
    return data.data;
  },
};