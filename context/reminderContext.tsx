import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { remindersApi, activitiesApi, Reminder, CreateReminderPayload, UpdateReminderPayload } from '@/lib/api';
import { getApiError } from '@/lib/api/errors';
import { useAuth } from './authContext';
import { haptics } from '@/lib/haptics';

interface ReminderContextType {
  reminders: Reminder[];
  isLoading: boolean;
  error: string | null;
  fetchReminders: () => Promise<void>;
  createReminder: (payload: CreateReminderPayload) => Promise<Reminder | null>;
  updateReminder: (id: string, payload: UpdateReminderPayload) => Promise<Reminder | null>;
  toggleReminder: (id: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export function ReminderProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setLoading]   = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await remindersApi.getAll();
      setReminders(data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch when user logs in
  useEffect(() => {
    if (isAuthenticated) fetchReminders();
    else setReminders([]);
  }, [isAuthenticated, fetchReminders]);

  const createReminder = async (payload: CreateReminderPayload): Promise<Reminder | null> => {
    setError(null);
    try {
      const created = await remindersApi.create(payload);
      // Optimistic UI — prepend to list immediately
      setReminders(prev => [created, ...prev]);

      // Log to activity history
      await activitiesApi.log({
        reminderId:    created.id,
        reminderTitle: created.title,
        location:      created.location,
        icon:          created.icon,
        eventType:     'created',
      });

      haptics.success();
      return created;
    } catch (err) {
      haptics.error();
      setError(getApiError(err));
      return null;
    }
  };

  const updateReminder = async (id: string, payload: UpdateReminderPayload): Promise<Reminder | null> => {
    setError(null);
    try {
      const updated = await remindersApi.update(id, payload);
      setReminders(prev => prev.map(r => r.id === id ? updated : r));
      return updated;
    } catch (err) {
      setError(getApiError(err));
      return null;
    }
  };

  const toggleReminder = async (id: string) => {
    haptics.toggle();
    // Optimistic update — flip locally before API responds
    setReminders(prev =>
      prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
    );
    try {
      const updated = await remindersApi.toggle(id);
      // Sync with server's actual state
      setReminders(prev => prev.map(r => r.id === id ? updated : r));

      await activitiesApi.log({
        reminderId:    updated.id,
        reminderTitle: updated.title,
        location:      updated.location,
        icon:          updated.icon,
        eventType:     'toggled',
      });
    } catch (err) {
      // Revert optimistic update on failure
      haptics.error();
      setReminders(prev =>
        prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
      );
      setError(getApiError(err));
    }
  };

  const deleteReminder = async (id: string) => {
    haptics.remove();
    const snapshot = reminders; // save for rollback
    // Optimistic remove
    setReminders(prev => prev.filter(r => r.id !== id));
    try {
      const target = snapshot.find(r => r.id === id);
      await remindersApi.delete(id);

      if (target) {
        await activitiesApi.log({
          reminderId:    target.id,
          reminderTitle: target.title,
          location:      target.location,
          icon:          target.icon,
          eventType:     'deleted',
        });
      }
    } catch (err) {
      haptics.error();
      setReminders(snapshot); // rollback
      setError(getApiError(err));
    }
  };

  return (
    <ReminderContext.Provider value={{
      reminders, isLoading, error,
      fetchReminders, createReminder,
      updateReminder, toggleReminder, deleteReminder,
    }}>
      {children}
    </ReminderContext.Provider>
  );
}

export function useReminders() {
  const ctx = useContext(ReminderContext);
  if (!ctx) throw new Error('useReminders must be used inside ReminderProvider');
  return ctx;
}