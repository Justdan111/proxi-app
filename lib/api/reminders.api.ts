import apiClient from './client';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Timeframe {
  startTime: string;
  endTime: string;
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  location: string;
  address: string;
  radius: number;
  enabled: boolean;
  icon: string;
  frequency: 'once' | 'always';
  timeframe?: Timeframe;
  coordinates: Coordinates;
  triggered: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderPayload {
  title: string;
  location: string;
  address: string;
  radius: number;
  icon: string;
  frequency: 'once' | 'always';
  timeframe?: Timeframe;
  coordinates: Coordinates;
}

export interface UpdateReminderPayload {
  // Set when a `once` reminder fires: the server owns completion state so it
  // survives a reinstall and syncs across devices.
  triggered?: boolean;
  enabled?: boolean;
  title?: string;
  location?: string;
  address?: string;
  radius?: number;
  icon?: string;
  frequency?: 'once' | 'always';
  timeframe?: Timeframe;
  coordinates?: Coordinates;
}

export const remindersApi = {
  getAll: async (): Promise<Reminder[]> => {
    const { data } = await apiClient.get('/api/reminders');
    return data.data;
  },

  getOne: async (id: string): Promise<Reminder> => {
    const { data } = await apiClient.get(`/api/reminders/${id}`);
    return data.data;
  },

  create: async (payload: CreateReminderPayload): Promise<Reminder> => {
    const { data } = await apiClient.post('/api/reminders', payload);
    return data.data;
  },

  update: async (id: string, payload: UpdateReminderPayload): Promise<Reminder> => {
    const { data } = await apiClient.put(`/api/reminders/${id}`, payload);
    return data.data;
  },

  toggle: async (id: string): Promise<Reminder> => {
    const { data } = await apiClient.patch(`/api/reminders/${id}/toggle`);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/reminders/${id}`);
  },
};