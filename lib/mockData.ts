export interface Reminder {
  id: string;
  title: string;
  location: string;
  distance: string;
  radius: number;
  enabled: boolean;
  icon: string;
  frequency?: string;
}

export const reminders: Reminder[] = [
  {
    id: '1',
    title: 'Buy fuel',
    location: 'Shell Station, Atlantic Ave',
    distance: '398m',
    radius: 300,
    enabled: true,
    icon: '⛽',
    frequency: 'Repeats daily',
  },
  {
    id: '2',
    title: 'Pick up dry cleaning',
    location: 'The Cleaners, 5th Ave',
    distance: '1.2km',
    radius: 500,
    enabled: true,
    icon: '👜',
    frequency: 'Repeats weekly',
  },
  {
    id: '3',
    title: 'Gym session',
    location: 'Equinox, Dumbo',
    distance: '2.5km',
    radius: 100,
    enabled: false,
    icon: '💪',
    frequency: 'Repeats daily',
  },
];

export const userLocation = {
  city: 'Brooklyn',
  state: 'NY',
  lat: 40.6782,
  lng: -73.9442,
};
