import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Reminder {
  id: string;
  title: string;
  location: string;
  address: string;
  distance: string;
  radius: number;
  enabled: boolean;
  icon: string;
  frequency: 'once' | 'always';
  timeframe?: {
    startTime: string;
    endTime: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
  triggered: boolean;
}

interface ReminderContextType {
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'triggered'>) => void;
  removeReminder: (id: string) => void;
  toggleReminder: (id: string) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  markReminderTriggered: (id: string) => void;
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export function ReminderProvider({ children }: { children: ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([
    // Sample reminders for demo - these will be replaced by backend data
    {
      id: '1',
      title: 'Buy fuel',
      location: 'Shell Gas Station',
      address: 'Wuse II, Abuja',
      distance: '--',
      radius: 300,
      enabled: true,
      icon: '⛽',
      frequency: 'always',
      coordinates: { latitude: 9.0820, longitude: 7.4800 },
      createdAt: new Date(),
      triggered: false,
    },
    {
      id: '2',
      title: 'Buy groceries',
      location: 'Shoprite Mall',
      address: 'Jabi, Abuja',
      distance: '--',
      radius: 500,
      enabled: true,
      icon: '🛒',
      frequency: 'once',
      coordinates: { latitude: 9.0650, longitude: 7.4200 },
      createdAt: new Date(),
      triggered: false,
    },
  ]);

  const addReminder = (reminderData: Omit<Reminder, 'id' | 'createdAt' | 'triggered'>) => {
    const newReminder: Reminder = {
      ...reminderData,
      id: `reminder-${Date.now()}`,
      createdAt: new Date(),
      triggered: false,
    };
    setReminders(prev => [...prev, newReminder]);
    
    // TODO: Sync with backend
    // await api.createReminder(newReminder);
  };

  const removeReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    
    // TODO: Sync with backend
    // await api.deleteReminder(id);
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
    
    // TODO: Sync with backend
    // await api.updateReminder(id, { enabled: !currentState });
  };

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, ...updates } : r
    ));
    
    // TODO: Sync with backend
    // await api.updateReminder(id, updates);
  };

  const markReminderTriggered = (id: string) => {
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, triggered: true } : r
    ));
  };

  return (
    <ReminderContext.Provider value={{
      reminders,
      addReminder,
      removeReminder,
      toggleReminder,
      updateReminder,
      markReminderTriggered,
    }}>
      {children}
    </ReminderContext.Provider>
  );
}

export function useReminders() {
  const context = useContext(ReminderContext);
  if (!context) {
    throw new Error('useReminders must be used within a ReminderProvider');
  }
  return context;
}