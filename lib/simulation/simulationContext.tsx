import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { } from 'react-native';

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

interface ProximityAlert {
  id: string;
  reminder: Reminder;
  distance: number;
  timestamp: Date;
}

interface ReminderContextType {
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'triggered'>) => void;
  removeReminder: (id: string) => void;
  toggleReminder: (id: string) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  proximityAlerts: ProximityAlert[];
  currentSimulatedLocation: { latitude: number; longitude: number } | null;
  simulateUserLocation: (latitude: number, longitude: number) => void;
  isSimulationRunning: boolean;
  startSimulation: () => void;
  stopSimulation: () => void;
  clearProximityAlert: (id: string) => void;
  testLocations: TestLocation[];
}

export interface TestLocation {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  category: string;
  icon: string;
}

// Test locations for simulation (Abuja, Nigeria area)
export const testLocations: TestLocation[] = [
  {
    id: '1',
    name: 'Shell Gas Station',
    address: 'Wuse II, Abuja',
    coordinates: { latitude: 9.0820, longitude: 7.4800 },
    category: 'fuel',
    icon: '⛽',
  },
  {
    id: '2',
    name: 'Shoprite Mall',
    address: 'Jabi, Abuja',
    coordinates: { latitude: 9.0650, longitude: 7.4200 },
    category: 'shopping',
    icon: '🛒',
  },
  {
    id: '3',
    name: 'Transcorp Hilton',
    address: 'Maitama, Abuja',
    coordinates: { latitude: 9.0800, longitude: 7.4900 },
    category: 'hotel',
    icon: '🏨',
  },
  {
    id: '4',
    name: 'National Mosque',
    address: 'Central Area, Abuja',
    coordinates: { latitude: 9.0580, longitude: 7.4910 },
    category: 'landmark',
    icon: '🕌',
  },
  {
    id: '5',
    name: 'Jabi Lake Mall',
    address: 'Jabi, Abuja',
    coordinates: { latitude: 9.0700, longitude: 7.4150 },
    category: 'shopping',
    icon: '🏬',
  },
  {
    id: '6',
    name: 'Wuse Market',
    address: 'Wuse Zone 5, Abuja',
    coordinates: { latitude: 9.0750, longitude: 7.4700 },
    category: 'market',
    icon: '🛍️',
  },
  {
    id: '7',
    name: 'Gym & Fitness Center',
    address: 'Garki, Abuja',
    coordinates: { latitude: 9.0400, longitude: 7.4850 },
    category: 'fitness',
    icon: '💪',
  },
  {
    id: '8',
    name: 'Home',
    address: 'Maitama District, Abuja',
    coordinates: { latitude: 9.0765, longitude: 7.3986 },
    category: 'home',
    icon: '🏠',
  },
];

// Starting point for simulation (user's initial position)
const INITIAL_USER_LOCATION = { latitude: 9.0765, longitude: 7.3986 };

// Simulation path - user moving towards Shell Gas Station
const simulationPath = [
  { latitude: 9.0765, longitude: 7.3986 },  // Start at home
  { latitude: 9.0770, longitude: 7.4100 },
  { latitude: 9.0780, longitude: 7.4300 },
  { latitude: 9.0790, longitude: 7.4500 },
  { latitude: 9.0800, longitude: 7.4650 },
  { latitude: 9.0810, longitude: 7.4750 },
  { latitude: 9.0820, longitude: 7.4800 },  // Arrive at Shell Gas Station
];

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export function ReminderProvider({ children }: { children: ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: '1',
      title: 'Buy fuel',
      location: 'Shell Gas Station',
      address: 'Wuse II, Abuja',
      distance: '398m',
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
      distance: '1.2km',
      radius: 500,
      enabled: true,
      icon: '🛒',
      frequency: 'once',
      coordinates: { latitude: 9.0650, longitude: 7.4200 },
      createdAt: new Date(),
      triggered: false,
    },
  ]);

  const [proximityAlerts, setProximityAlerts] = useState<ProximityAlert[]>([]);
  const [currentSimulatedLocation, setCurrentSimulatedLocation] = useState<{ latitude: number; longitude: number } | null>(INITIAL_USER_LOCATION);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const simulationIndex = useRef(0);
  const simulationTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Refs to track current state values for use in interval callbacks
  const remindersRef = useRef(reminders);
  const proximityAlertsRef = useRef(proximityAlerts);
  
  // Keep refs in sync with state
  useEffect(() => {
    remindersRef.current = reminders;
  }, [reminders]);
  
  useEffect(() => {
    proximityAlertsRef.current = proximityAlerts;
  }, [proximityAlerts]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Format distance for display
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  // Check proximity for all reminders
  const checkProximity = (userLat: number, userLon: number) => {
    // Use refs to get current state values (avoids stale closure in setInterval)
    const currentReminders = remindersRef.current;
    const currentAlerts = proximityAlertsRef.current;
    
    currentReminders.forEach(reminder => {
      if (!reminder.enabled) return;
      
      // Check timeframe if set
      if (reminder.timeframe) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        if (currentTime < reminder.timeframe.startTime || currentTime > reminder.timeframe.endTime) {
          return; // Outside timeframe
        }
      }

      const distance = calculateDistance(
        userLat, 
        userLon, 
        reminder.coordinates.latitude, 
        reminder.coordinates.longitude
      );

      // Check if user is within radius
      if (distance <= reminder.radius) {
        // Check if already triggered (for 'once' frequency)
        if (reminder.frequency === 'once' && reminder.triggered) {
          return;
        }

        // Check if we already have an alert for this reminder
        const existingAlert = currentAlerts.find(a => a.reminder.id === reminder.id);
        if (!existingAlert) {
          const newAlert: ProximityAlert = {
            id: `alert-${Date.now()}-${reminder.id}`,
            reminder,
            distance,
            timestamp: new Date(),
          };
          
          setProximityAlerts(prev => [...prev, newAlert]);
          
          // Mark as triggered if frequency is 'once'
          if (reminder.frequency === 'once') {
            setReminders(prev => prev.map(r => 
              r.id === reminder.id ? { ...r, triggered: true } : r
            ));
          }
        }
      }
    });

    // Update distances for all reminders
    setReminders(prev => prev.map(reminder => ({
      ...reminder,
      distance: formatDistance(calculateDistance(
        userLat,
        userLon,
        reminder.coordinates.latitude,
        reminder.coordinates.longitude
      ))
    })));
  };

  // Simulate user movement
  const startSimulation = () => {
    if (isSimulationRunning) return;
    
    setIsSimulationRunning(true);
    simulationIndex.current = 0;
    
    simulationTimer.current = setInterval(() => {
      if (simulationIndex.current < simulationPath.length) {
        const newLocation = simulationPath[simulationIndex.current];
        setCurrentSimulatedLocation(newLocation);
        checkProximity(newLocation.latitude, newLocation.longitude);
        simulationIndex.current++;
      } else {
        stopSimulation();
      }
    }, 2000); // Move every 2 seconds
  };

  const stopSimulation = () => {
    setIsSimulationRunning(false);
    if (simulationTimer.current) {
      clearInterval(simulationTimer.current);
      simulationTimer.current = null;
    }
  };

  const simulateUserLocation = (latitude: number, longitude: number) => {
    setCurrentSimulatedLocation({ latitude, longitude });
    checkProximity(latitude, longitude);
  };

  const addReminder = (reminderData: Omit<Reminder, 'id' | 'createdAt' | 'triggered'>) => {
    const newReminder: Reminder = {
      ...reminderData,
      id: `reminder-${Date.now()}`,
      createdAt: new Date(),
      triggered: false,
    };
    setReminders(prev => [...prev, newReminder]);
  };

  const removeReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, ...updates } : r
    ));
  };

  const clearProximityAlert = (id: string) => {
    setProximityAlerts(prev => prev.filter(a => a.id !== id));
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationTimer.current) {
        clearInterval(simulationTimer.current);
      }
    };
  }, []);

  return (
    <ReminderContext.Provider value={{
      reminders,
      addReminder,
      removeReminder,
      toggleReminder,
      updateReminder,
      proximityAlerts,
      currentSimulatedLocation,
      simulateUserLocation,
      isSimulationRunning,
      startSimulation,
      stopSimulation,
      clearProximityAlert,
      testLocations,
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
